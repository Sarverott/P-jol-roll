import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import * as store from "../resources/store.js";
import { DATASET_URL, fromDataset, remote } from "./remote.js";

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

/*
The Hugging Face token of the visitor asking (phase 32): set for the length of one request to
/mcp by its Authorization header (src/openapi/server.ts), so a question on the demo space becomes
a vector on the visitor's own account - never on the owner's.
*/
export const visitorToken = new AsyncLocalStorage<string | undefined>();

// the models of Ollama whose same weights Hugging Face serves (the vectors must be the same)
const ON_HUGGING_FACE: Record<string, string> = { "bge-m3": "BAAI/bge-m3" };

async function byHuggingFace(model: string, text: string) {
	const token = visitorToken.getStore();
	const repo = ON_HUGGING_FACE[model.replace(/:latest$/, "")];
	if (!token || !repo) return undefined;
	try {
		const answer = await fetch(
			`https://router.huggingface.co/hf-inference/models/${repo}/pipeline/feature-extraction`,
			{
				method: "POST",
				headers: {
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({ inputs: [text], normalize: true }),
				signal: AbortSignal.timeout(30_000),
			},
		);
		if (!answer.ok) return undefined;
		const vectors = (await answer.json()) as number[][];
		return Array.isArray(vectors[0]) ? vectors[0] : undefined;
	} catch {
		return undefined;
	}
}

// a question as a vector of the same model: Ollama here, else Hugging Face on the visitor's
// token; undefined without either
export async function questionVector(
	text: string,
): Promise<number[] | undefined> {
	const model = embeddingModel();
	if (!model || !text.trim()) return undefined;
	return (
		(await byOllama(model, text)) ?? (await byHuggingFace(model.model, text))
	);
}

async function byOllama(
	model: { model: string },
	text: string,
): Promise<number[] | undefined> {
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

/*
On a host reading the dataset from Hugging Face (remote.ts, the demo space) the vectors are
taken from there on the first question: the listing of embeddings/, then every year's file,
eight at a time (about 760 MB of bge-m3). Asked once; a failure lets it be asked again.
*/
let taking: Promise<void> | undefined;
export function takeVectors(): Promise<void> {
	if (!remote || embeddingModel()) return Promise.resolve();
	taking ??= (async () => {
		const api = DATASET_URL.replace(
			/^(https:\/\/[^/]+)\/datasets\/([^/]+\/[^/]+)\/resolve\/([^/]+)$/,
			"$1/api/datasets/$2/tree/$3",
		);
		const list = async (path: string) =>
			(await (await fetch(`${api}/${path}`)).json()) as {
				path: string;
				type: string;
			}[];
		const files: string[] = [];
		const walk = async (path: string) => {
			for (const one of await list(path))
				if (one.type === "directory") await walk(one.path);
				else if (/\.(parquet|json)$/.test(one.path)) files.push(one.path);
		};
		await walk("embeddings");
		// model.json last: the vectors count as here only once every year is
		const ordered = [
			...files.filter((one) => !one.endsWith("model.json")),
			...files.filter((one) => one.endsWith("model.json")),
		];
		let next = 0;
		const worker = async () => {
			while (next < ordered.length) await fromDataset(ordered[next++]);
		};
		await Promise.all(Array.from({ length: 8 }, worker));
	})().catch(() => {
		taking = undefined;
	});
	return taking;
}

// the years that have vectors: "DU/1918", ...
export function embeddedYears(): string[] {
	const model = embeddingModel();
	if (!model) return [];
	return readdirSync(model.folder, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.flatMap((journal) =>
			readdirSync(join(model.folder, journal.name))
				.filter((name) => /^\d{4}\.parquet$/.test(name))
				.map((name) => `${journal.name}/${name.slice(0, 4)}`),
		)
		.sort();
}

/*
The vectors of a year read once per process, kept small: one matrix of int8 per year (each
normalized vector times 127), a quarter of float32 and enough to rank by - every year at once
as numbers of JavaScript would not fit the heap of the api (phase 30).
*/
type Year = { elis: string[]; matrix: Int8Array; size: number };
const read = new Map<string, Promise<Year>>();
const cached = (journal: string, year: number) => {
	const key = `${journal}/${year}`;
	if (!read.has(key))
		read.set(
			key,
			vectorsOf(journal, year).then((vectors) => {
				const elis = [...vectors.keys()];
				const size = vectors.values().next().value?.length ?? 0;
				const matrix = new Int8Array(elis.length * size);
				elis.forEach((eli, row) => {
					const vector = vectors.get(eli) as number[];
					for (let i = 0; i < size; i++)
						matrix[row * size + i] = Math.round(
							Math.max(-1, Math.min(1, vector[i])) * 127,
						);
				});
				return { elis, matrix, size };
			}),
		);
	return read.get(key) as Promise<Year>;
};

/*
The acts nearest to a question by meaning (phase 30, the mastermind finds what to read by it):
the question a vector of the same model, compared with the vector of every act of every year
that has them (a dot product: the vectors are normalized). Undefined without vectors here or
without Ollama to make the question one.
*/
export async function nearest(
	question: string,
	{ journal = "", limit = 10 } = {},
): Promise<{ ELI: string; score: number }[] | undefined> {
	await takeVectors();
	const years = embeddedYears().filter(
		(one) => !journal || one.startsWith(`${journal}/`),
	);
	if (!years.length) return undefined;
	const wanted = await questionVector(question);
	if (!wanted) return undefined;
	const best: { ELI: string; score: number }[] = [];
	for (const one of years) {
		const [name, year] = one.split("/");
		const { elis, matrix, size } = await cached(name, Number(year));
		for (let row = 0; row < elis.length; row++) {
			const ELI = elis[row];
			let score = 0;
			for (let i = 0; i < size; i++)
				score += wanted[i] * matrix[row * size + i];
			score /= 127;
			if (best.length < limit || score > best[best.length - 1].score) {
				best.push({ ELI, score: Math.round(score * 1000) / 1000 });
				best.sort((a, b) => b.score - a.score);
				best.length = Math.min(best.length, limit);
			}
		}
	}
	return best;
}
