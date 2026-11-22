/*
The remote mode of reading (phase 10): the demo on Hugging Face reads the dataset prepared
there instead of taking all of it. With DATASET_URL set, every file a reader asks for is
fetched once from the dataset (or, for the details of an act, from the bucket) into the
local side - RESOURCES_DIR, a cache then - and read from there as always; raw files of acts
are not fetched at all, readers are sent to the bucket. Without DATASET_URL nothing changes.
  DATASET_URL=https://huggingface.co/datasets/Sarverott/polish_national_law_docs/resolve/main
  BUCKET_URL=https://huggingface.co/buckets/Sarverott/raw-law-of-poland/resolve
  REMOTE_HOURS=6     how long a fetched file is taken as fresh
It never asks the sources of the law - only the copies of the project on Hugging Face.
*/
import { existsSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import log from "../logging/setup.js";
import * as store from "../resources/store.js";

const setting = (name: string) => process.env[name]?.trim() ?? "";
export const DATASET_URL = setting("DATASET_URL").replace(/\/+$/, "");
export const BUCKET_URL = setting("BUCKET_URL").replace(/\/+$/, "");
export const remote = Boolean(DATASET_URL);
const FRESH = (Number(setting("REMOTE_HOURS")) || 6) * 3600_000;
const AGENT = "P-jol-roll demo (+https://github.com/Sarverott/P-jol-roll)";

// files asked for right now, so a page asked twice fetches once; and the misses, for a while
const pending = new Map<string, Promise<boolean>>();
const missing = new Map<string, number>();

/*
A path asked for is built from an address a reader sent (a journal, a year, a preset), so it
is let through only as plain names below the directory: no "..", no absolute path, nothing
but letters, digits and . _ - between slashes. Before phase 18 a journal ".." named a file
beside the dataset and its address on Hugging Face (CodeQL js/path-injection and
js/request-forgery, docs/almanac/cataclistics/codeql-first-scan.md).
*/
const PLAIN = /^(?:[\w-][\w.-]*\/)*[\w-][\w.-]*$/;
export function inside(dir: string, path: string): string | undefined {
	if (!PLAIN.test(path) || path.split("/").includes("..")) return undefined;
	const root = resolve(dir);
	const local = resolve(root, path);
	const below = relative(root, local);
	return below && !below.startsWith("..") && below === path ? local : undefined;
}

// a file of the dataset (or the bucket) on the local side, fetched when it is not there or
// is old; false when Hugging Face does not have it either (or the path is not a plain one)
function take(base: string, dir: string, path: string): Promise<boolean> {
	const local = inside(dir, path);
	if (!local) {
		log.warning(`remote: ${JSON.stringify(path)} is not a path of the dataset`);
		return Promise.resolve(false);
	}
	if (existsSync(local) && Date.now() - statSync(local).mtimeMs < FRESH)
		return Promise.resolve(true);
	if (Date.now() - (missing.get(local) ?? 0) < FRESH)
		return Promise.resolve(existsSync(local));
	const known = pending.get(local);
	if (known) return known;
	const work = (async () => {
		try {
			const answer = await fetch(`${base}/${encodeURI(path)}`, {
				headers: { "user-agent": AGENT },
			});
			if (!answer.ok) {
				missing.set(local, Date.now());
				return existsSync(local);
			}
			await store.writeWhole(local, Buffer.from(await answer.arrayBuffer()));
			return true;
		} catch (error) {
			log.warning(`remote: ${path} not taken (${(error as Error).message})`);
			return existsSync(local);
		} finally {
			pending.delete(local);
		}
	})();
	pending.set(local, work);
	return work;
}

export const fromDataset = (path: string) =>
	take(DATASET_URL, store.DATASET_DIR, path);

export const fromBucket = (path: string) =>
	BUCKET_URL
		? take(BUCKET_URL, store.BUCKET_DIR, path)
		: Promise.resolve(false);

// where a raw file of an act is read on the bucket
export const bucketUrl = (path: string) =>
	BUCKET_URL ? `${BUCKET_URL}/${path}` : undefined;
