import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, readFileSync } from "node:fs";
import { mkdir, readdir, rename, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebStream } from "node:stream/web";
import { pathToFileURL } from "node:url";
import {
	downloadFile,
	listFiles,
	type RepoDesignation,
	uploadFiles,
} from "@huggingface/hub";
import log from "../logging/setup.js";
import type { HuggingfaceScope } from "../vars/interfaces/index.js";
import type { HuggingfaceScope as HuggingfaceTypes } from "../vars/types/index.js";
import { RESOURCES_DIR } from "./store.js";

/*
Local directories of resources/ are compared with repositories of huggingface
file by file, the way git does it: by path, size and hash of content. Only
what differs is moved, so repeating push or pull costs one listing.
*/

// token is needed for push and for private repositories - HF_TOKEN in environment or in .env;
// empty or only spaces means no token (.env.example)
try {
	process.loadEnvFile();
} catch {}
const accessToken = process.env.HF_TOKEN?.trim() || undefined;

// never moved in any direction
const IGNORED = [".git", "node_modules", ".venv", "__pycache__"];

// "https://huggingface.co/datasets/Sarverott/x" -> "datasets/Sarverott/x"
export const repoOf = (url: string) =>
	new URL(url).pathname.slice(1) as RepoDesignation;

export function target(name: string) {
	const map: HuggingfaceTypes.ResourcesMap = JSON.parse(
		readFileSync(join(RESOURCES_DIR, ".map.json"), "utf8"),
	);
	if (!map[name])
		throw new Error(`${name} is not in .map.json: ${Object.keys(map)}`);
	return { repo: repoOf(map[name]), dir: join(RESOURCES_DIR, name) };
}

export async function localFiles(dir: string): Promise<Map<string, number>> {
	const files = new Map<string, number>();
	const entries = await readdir(dir, { recursive: true, withFileTypes: true });
	for (const entry of entries) {
		const path = join(entry.parentPath, entry.name).slice(dir.length + 1);
		const skipped =
			path.split("/").some((part) => IGNORED.includes(part)) ||
			path.endsWith(".part");
		if (entry.isFile() && !skipped)
			files.set(path, (await stat(join(dir, path))).size);
	}
	return files;
}

export async function remoteFiles(
	repo: RepoDesignation,
): Promise<Map<string, HuggingfaceScope.RemoteFile>> {
	const files = new Map<string, HuggingfaceScope.RemoteFile>();
	for await (const file of listFiles({ repo, recursive: true, accessToken })) {
		if (file.type === "file")
			files.set(file.path, {
				size: file.size,
				oid: file.oid,
				lfsOid: file.lfs?.oid,
			});
	}
	return files;
}

// the same hash that git gives to a file: sha1 of "blob {size}\0" and content
export async function hashOf(path: string, algorithm: "git" | "sha256") {
	const hash = createHash(algorithm === "git" ? "sha1" : "sha256");
	if (algorithm === "git") hash.update(`blob ${(await stat(path)).size}\0`);
	await pipeline(createReadStream(path), hash);
	return hash.digest("hex");
}

async function sameContent(path: string, remote: HuggingfaceScope.RemoteFile) {
	if (remote.lfsOid) return (await hashOf(path, "sha256")) === remote.lfsOid;
	if (remote.oid) return (await hashOf(path, "git")) === remote.oid;
	return true; // bucket gives only size
}

// content is read only when path and size are the same on both sides
export async function compare(
	dir: string,
	local: Map<string, number>,
	remote: Map<string, HuggingfaceScope.RemoteFile>,
	same = sameContent,
): Promise<HuggingfaceScope.Difference> {
	const difference: HuggingfaceScope.Difference = {
		upload: [],
		changed: [],
		download: [],
		same: 0,
	};
	for (const [path, size] of local) {
		const there = remote.get(path);
		if (!there) difference.upload.push(path);
		else if (size !== there.size || !(await same(join(dir, path), there)))
			difference.changed.push(path);
		else difference.same += 1;
	}
	for (const path of remote.keys())
		if (!local.has(path)) difference.download.push(path);
	return difference;
}

export async function plan(name: string) {
	const { repo, dir } = target(name);
	await mkdir(dir, { recursive: true });
	const difference = await compare(
		dir,
		await localFiles(dir),
		await remoteFiles(repo),
	);
	return { repo, dir, ...difference };
}

/*
Huggingface lets a repository take 128 commits an hour; the 129th is refused with 429 and
"You can retry this action in about 1 hour". The push of 14170 files in commits of 100 died
there (2026-11-22). Such a refusal is waited out and the same commit is tried again; the time
is read from the message, an hour when it names none.
*/
export function rateLimitWait(error: unknown): number | undefined {
	const status = (error as { statusCode?: number })?.statusCode;
	const message = error instanceof Error ? error.message : String(error);
	if (status !== 429 && !/rate limit/i.test(message)) return undefined;
	const named = message.match(/about (\d+|an?) (second|minute|hour)/i);
	if (!named) return 3_600_000;
	const count = /^\d+$/.test(named[1]) ? Number(named[1]) : 1;
	const unit = { second: 1_000, minute: 60_000, hour: 3_600_000 }[
		named[2].toLowerCase() as "second" | "minute" | "hour"
	];
	return count * unit + 60_000; // a minute more, so the hour has surely passed
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

// files that are new or changed here go there, in commits of {batch} files;
// nothing is ever deleted there
export async function push(name: string, batch: number, wait = sleep) {
	if (!accessToken) throw new Error("HF_TOKEN is missing");
	const { repo, dir, upload, changed, same } = await plan(name);
	const paths = [...upload, ...changed];
	log.info(`${repo}: ${paths.length} to send, ${same} already there`, {
		repo,
		send: paths.length,
		same,
	});

	for (let sent = 0; sent < paths.length; sent += batch) {
		const files = paths.slice(sent, sent + batch);
		const commit = () =>
			uploadFiles({
				repo,
				accessToken,
				files: files.map((path) => ({
					path,
					content: pathToFileURL(join(dir, path)),
				})),
				commitTitle: `P-jol-roll: ${files.length} files (${sent + files.length} of ${paths.length})`,
			});
		for (;;) {
			try {
				await commit();
				break;
			} catch (error) {
				const ms = rateLimitWait(error);
				if (ms === undefined) throw error;
				log.warning(
					`${repo} takes no more commits for now - waiting ${Math.round(ms / 60_000)} min, then the same ${files.length} files again`,
					{ repo, waitMs: ms, sent },
				);
				await wait(ms);
			}
		}
		log.info(`${sent + files.length} of ${paths.length}`, {
			sent: sent + files.length,
			all: paths.length,
		});
	}
}

// files that are there and not here come here; changed ones are only named,
// local work is never overwritten. {parallel} files at a time (the dataset holds tens of
// thousands of small texts); each appears under its name only when it is whole.
export async function pull(name: string, parallel = 8) {
	const { repo, dir, download, changed } = await plan(name);
	log.info(`${repo}: ${download.length} to take, ${parallel} at a time`, {
		repo,
		take: download.length,
		parallel,
	});

	let next = 0;
	let taken = 0;
	const take = async (path: string) => {
		const blob = await downloadFile({ repo, path, accessToken });
		if (!blob) throw new Error(`${path} vanished from ${repo}`);
		const file = join(dir, path);
		await mkdir(dirname(file), { recursive: true });
		await pipeline(
			Readable.fromWeb(blob.stream() as WebStream),
			createWriteStream(`${file}.part`),
		);
		await rename(`${file}.part`, file);
		taken += 1;
		if (taken % 500 === 0 || taken === download.length)
			log.info(`${taken} of ${download.length}`, {
				taken,
				all: download.length,
			});
	};
	await Promise.all(
		Array.from({ length: Math.max(1, parallel) }, async () => {
			while (next < download.length) await take(download[next++]);
		}),
	);
	if (changed.length)
		log.warning(`differs on both sides, left as it is here: ${changed}`, {
			changed,
		});
}
