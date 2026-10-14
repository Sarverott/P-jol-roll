import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { appendFile, mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Act } from "./eli.js";

// local copies of huggingface repositories listed in resources/.map.json
export const RESOURCES_DIR = process.env.RESOURCES_DIR ?? "resources";
export const DATASET_DIR = join(RESOURCES_DIR, "dataset");
export const BUCKET_DIR = join(RESOURCES_DIR, "bucket");

type ActAddress = Pick<Act, "publisher" | "year" | "address">;

// dataset: tables that are small and read often
export const indexPath = () => join(DATASET_DIR, "lists", "index.json");

export const listPath = (name: string) =>
	join(DATASET_DIR, "lists", `${name}.json`);

// metadata of one year, one act per line
export const listingPath = (publisher: string, year: number) =>
	join(DATASET_DIR, "acts", publisher, `${year}.jsonl`);

// what browser saw on websites that show the act, one visit per line
export const checkupPath = (publisher: string, year: number) =>
	join(DATASET_DIR, "checkups", publisher, `${year}.jsonl`);

// which files of bucket are gathered, with their checksums - written at the moment
// file lands on disk, so every copy made later can be compared with what Sejm gave
export const manifestPath = (publisher: string, year: number) =>
	join(DATASET_DIR, "files", publisher, `${year}.jsonl`);

// date of the newest change that "gather --since last" has seen
export const changesPath = () => join(DATASET_DIR, "lists", "changes.json");

// bucket: raw files of every act, side by side, named by address -
// the identifier that API gives to every act ("WDU20260000001")
export const bucketPath = (act: ActAddress, suffix: string) =>
	`${act.publisher}/${act.year}/${act.address}${suffix}`;

export const actPath = (act: ActAddress, suffix: string) =>
	join(BUCKET_DIR, bucketPath(act, suffix));

export interface FileRecord {
	path: string; // inside of bucket
	size: number;
	sha256: string;
	url: string; // where it was taken from
	gatheredAt: string;
}

export const readJson = <Value>(path: string): Value | undefined =>
	existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;

export const readJsonl = <Line>(path: string): Line[] =>
	existsSync(path)
		? readFileSync(path, "utf8")
				.split("\n")
				.filter(Boolean)
				.map((line) => JSON.parse(line))
		: [];

// records of one year by path, the newest record of a file wins
export const sealed = (publisher: string, year: number) =>
	new Map(
		readJsonl<FileRecord>(manifestPath(publisher, year)).map((record) => [
			record.path,
			record,
		]),
	);

export const sha256 = (content: string | Buffer) =>
	createHash("sha256").update(content).digest("hex");

// file appears under its name only when it is complete
export async function writeWhole(path: string, content: string | Buffer) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(`${path}.part`, content);
	await rename(`${path}.part`, path);
	return { size: Buffer.byteLength(content), sha256: sha256(content) };
}

export const jsonText = (value: unknown) =>
	`${JSON.stringify(value, null, "\t")}\n`;

export const saveJson = (path: string, value: unknown) =>
	writeWhole(path, jsonText(value));

export const saveJsonl = (path: string, lines: unknown[]) =>
	writeWhole(path, lines.map((line) => `${JSON.stringify(line)}\n`).join(""));

export async function saveListing(
	publisher: string,
	year: number,
	acts: Act[],
) {
	await saveJsonl(
		listingPath(publisher, year),
		[...acts].sort((a, b) => a.pos - b.pos),
	);
}

// years of journals whose listings are here, in order
export function listedYears(): { publisher: string; year: number }[] {
	const dir = join(DATASET_DIR, "acts");
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.sort()
		.flatMap((publisher) =>
			readdirSync(join(dir, publisher))
				.filter((name) => name.endsWith(".jsonl"))
				.map((name) => ({ publisher, year: Number.parseInt(name, 10) }))
				.sort((a, b) => a.year - b.year),
		);
}

export async function appendLine(path: string, value: unknown) {
	await mkdir(dirname(path), { recursive: true });
	await appendFile(path, `${JSON.stringify(value)}\n`);
}
