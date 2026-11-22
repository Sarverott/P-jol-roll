import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import * as store from "../resources/store.js";

/*
The vectors of texts that task embed made (scripts/embeddings/embed.py, phase 17): one per
act, in dataset/embeddings/<model>/<journal>/<year>.parquet. Read here for the search by
meaning (Typesense) and the map by meaning; a question becomes a vector by the same model of
Ollama, or nothing when Ollama does not answer - then everything works by words alone.
*/

try {
	process.loadEnvFile();
} catch {}

export const OLLAMA_URL = (
	process.env.OLLAMA_URL || "http://127.0.0.1:11434"
).replace(/\/+$/, "");

type Model = { model: string; dimensions: number; folder: string };

// the model whose vectors are here: EMBED_MODEL, else the only one made
export function embeddingModel(): Model | undefined {
	const root = join(store.DATASET_DIR, "embeddings");
	if (!existsSync(root)) return undefined;
	const wanted = process.env.EMBED_MODEL?.replace(/[:/]/g, "-");
	const folders = readdirSync(root).filter((name) =>
		existsSync(join(root, name, "model.json")),
	);
	const folder = wanted ? folders.find((name) => name === wanted) : folders[0];
	if (!folder) return undefined;
	const about = JSON.parse(
		readFileSync(join(root, folder, "model.json"), "utf8"),
	);
	return {
		model: about.model,
		dimensions: about.dimensions,
		folder: join(root, folder),
	};
}

// ELI -> vector, for the acts of a year that have one
export async function vectorsOf(publisher: string, year: number) {
	const vectors = new Map<string, number[]>();
	const model = embeddingModel();
	const path = model && join(model.folder, publisher, `${year}.parquet`);
	if (!path || !existsSync(path)) return vectors;
	const rows = (await parquetReadObjects({
		file: await asyncBufferFromFile(path),
		columns: ["ELI", "vector"],
	})) as { ELI: string; vector: number[] }[];
	for (const { ELI, vector } of rows) vectors.set(ELI, Array.from(vector));
	return vectors;
}

// a question as a vector of the same model, or undefined without Ollama
export async function questionVector(
	text: string,
): Promise<number[] | undefined> {
	const model = embeddingModel();
	if (!model || !text.trim()) return undefined;
	try {
		const answer = await fetch(`${OLLAMA_URL}/api/embed`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				model: model.model,
				input: [text],
				truncate: true,
			}),
			signal: AbortSignal.timeout(20_000),
		});
		if (!answer.ok) return undefined;
		const { embeddings } = (await answer.json()) as { embeddings: number[][] };
		return embeddings[0];
	} catch {
		return undefined;
	}
}
