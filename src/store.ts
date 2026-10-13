import { existsSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Act } from "./eli.js";

// clones of huggingface repositories listed in resources/.map.json
export const DATASET_DIR = "resources/dataset";
export const BUCKET_DIR = "resources/bucket";

// metadata of one year, one act per line
export const listingPath = (publisher: string, year: number) =>
	join(DATASET_DIR, "acts", publisher, `${year}.jsonl`);

// raw pdf named by address - the identifier that API gives to every act
export const pdfPath = (act: Pick<Act, "publisher" | "year" | "address">) =>
	join(BUCKET_DIR, act.publisher, String(act.year), `${act.address}.pdf`);

// file appears under its name only when it is complete
async function writeWhole(path: string, content: string | Buffer) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(`${path}.part`, content);
	await rename(`${path}.part`, path);
}

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

export const hasPdf = (act: Pick<Act, "publisher" | "year" | "address">) =>
	existsSync(pdfPath(act));

export async function savePdf(
	act: Pick<Act, "publisher" | "year" | "address">,
	content: Buffer,
) {
	await writeWhole(pdfPath(act), content);
}
