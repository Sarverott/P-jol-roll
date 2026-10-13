import { existsSync } from "node:fs";
import { appendFile, mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Act, Part } from "./eli.js";

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

// bucket: raw files of every act, side by side, named by address -
// the identifier that API gives to every act ("WDU20260000001")
const PART_SUFFIX: Record<Part, string> = {
	details: ".json",
	references: ".references.json",
	pdf: ".pdf",
	html: ".html",
};

export const partPath = (act: ActAddress, part: Part) =>
	join(
		BUCKET_DIR,
		act.publisher,
		String(act.year),
		`${act.address}${PART_SUFFIX[part]}`,
	);

export const hasPart = (act: ActAddress, part: Part) =>
	existsSync(partPath(act, part));

// file appears under its name only when it is complete
export async function writeWhole(path: string, content: string | Buffer) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(`${path}.part`, content);
	await rename(`${path}.part`, path);
}

export const saveJson = (path: string, value: unknown) =>
	writeWhole(path, `${JSON.stringify(value, null, "\t")}\n`);

export async function saveListing(
	publisher: string,
	year: number,
	acts: Act[],
) {
	const lines = [...acts]
		.sort((a, b) => a.pos - b.pos)
		.map((act) => JSON.stringify(act));
	await writeWhole(listingPath(publisher, year), `${lines.join("\n")}\n`);
}

export async function appendLine(path: string, value: unknown) {
	await mkdir(dirname(path), { recursive: true });
	await appendFile(path, `${JSON.stringify(value)}\n`);
}
