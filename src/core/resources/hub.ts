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
import { RESOURCES_DIR } from "./store.js";

/*
Local directories of resources/ are compared with repositories of huggingface
file by file, the way git does it: by path, size and hash of content. Only
what differs is moved, so repeating push or pull costs one listing.
*/

// token is needed for push and for private repositories - HF_TOKEN in environment or in .env
try {
	process.loadEnvFile();
} catch {}
const accessToken = process.env.HF_TOKEN;

// never moved in any direction
const IGNORED = [".git", "node_modules", ".venv", "__pycache__"];

export interface RemoteFile {
	size: number;
	oid?: string; // hash of git blob, buckets do not have it
	lfsOid?: string; // sha256 of big file kept outside of git
}

export interface Difference {
	upload: string[]; // here and not there
	changed: string[]; // on both sides with other content
	download: string[]; // there and not here
	same: number;
}

// "https://huggingface.co/datasets/Sarverott/x" -> "datasets/Sarverott/x"
export const repoOf = (url: string) =>
	new URL(url).pathname.slice(1) as RepoDesignation;

export function target(name: string) {
	const map: Record<string, string> = JSON.parse(
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
): Promise<Map<string, RemoteFile>> {
	const files = new Map<string, RemoteFile>();
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

async function sameContent(path: string, remote: RemoteFile) {
	if (remote.lfsOid) return (await hashOf(path, "sha256")) === remote.lfsOid;
	if (remote.oid) return (await hashOf(path, "git")) === remote.oid;
	return true; // bucket gives only size
}

// content is read only when path and size are the same on both sides
export async function compare(
	dir: string,
	local: Map<string, number>,
	remote: Map<string, RemoteFile>,
	same = sameContent,
): Promise<Difference> {
	const difference: Difference = {
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

// files that are new or changed here go there, in commits of {batch} files;
// nothing is ever deleted there
export async function push(name: string, batch: number) {
	if (!accessToken) throw new Error("HF_TOKEN is missing");
	const { repo, dir, upload, changed, same } = await plan(name);
	const paths = [...upload, ...changed];
	console.log(`${repo}: ${paths.length} to send, ${same} already there`);

	for (let sent = 0; sent < paths.length; sent += batch) {
		const files = paths.slice(sent, sent + batch);
		await uploadFiles({
			repo,
			accessToken,
			files: files.map((path) => ({
				path,
				content: pathToFileURL(join(dir, path)),
			})),
			commitTitle: `P-jol-roll: ${files.length} files (${sent + files.length} of ${paths.length})`,
		});
		console.log(`${sent + files.length} of ${paths.length}`);
	}
}

// files that are there and not here come here; changed ones are only named,
// local work is never overwritten
export async function pull(name: string) {
	const { repo, dir, download, changed } = await plan(name);
	console.log(`${repo}: ${download.length} to take`);

	for (const path of download) {
		const blob = await downloadFile({ repo, path, accessToken });
		if (!blob) throw new Error(`${path} vanished from ${repo}`);
		const file = join(dir, path);
		await mkdir(dirname(file), { recursive: true });
		await pipeline(
			Readable.fromWeb(blob.stream() as WebStream),
			createWriteStream(`${file}.part`),
		);
		await rename(`${file}.part`, file);
	}
	if (changed.length)
		console.warn(`differs on both sides, left as it is here: ${changed}`);
}
