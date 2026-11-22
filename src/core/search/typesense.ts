import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import log from "../logging/setup.js";
import { detailsTablePath } from "../methods/compile.js";
import { markdownPath } from "../parsing/text.js";
import {
	embeddingModel,
	questionVector,
	vectorsOf,
} from "../reading/embeddings.js";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";

/*
Search over every act of every year (phase 14) by Typesense, a service of its own
(resources/services/typesense.yaml). "task search:index" fills it from the dataset - the
listings, keywords of the details table, and with --texts the beginning of each markdown -
and the api asks it (/api/search). Plain http with the key in a header: no client library.
Without the service the api says how to start it; nothing else depends on it.
*/

try {
	process.loadEnvFile();
} catch {}

export const TYPESENSE_URL = (
	process.env.TYPESENSE_URL || "http://127.0.0.1:8108"
).replace(/\/+$/, "");
const COLLECTION = "acts";
const TEXT_LENGTH = 2000;

// TYPESENSE_API_KEY, or the secret task init made for the service
function key() {
	if (process.env.TYPESENSE_API_KEY)
		return process.env.TYPESENSE_API_KEY.trim();
	const file = join(store.RESOURCES_DIR, "secrets", "typesense_api_key");
	return existsSync(file) ? readFileSync(file, "utf8").trim() : "";
}

async function ask(path: string, init: RequestInit = {}) {
	const response = await fetch(`${TYPESENSE_URL}${path}`, {
		...init,
		headers: { "X-TYPESENSE-API-KEY": key(), ...init.headers },
		signal: AbortSignal.timeout(30_000),
	});
	return response;
}

const SCHEMA = {
	name: COLLECTION,
	fields: [
		{ name: "eli", type: "string" },
		{ name: "title", type: "string", locale: "pl" },
		{
			name: "keywords",
			type: "string[]",
			optional: true,
			facet: true,
			locale: "pl",
		},
		{ name: "text", type: "string", optional: true, locale: "pl" },
		{ name: "type", type: "string", facet: true },
		{ name: "status", type: "string", facet: true },
		{ name: "publisher", type: "string", facet: true },
		{ name: "year", type: "int32", facet: true },
		{ name: "promulgation", type: "string", optional: true, index: false },
	],
	default_sorting_field: "year",
};

// the vectors of task embed, when there are any: one more field, searched by meaning
const embeddingField = () => {
	const model = embeddingModel();
	return model
		? {
				name: "embedding",
				type: "float[]",
				num_dim: model.dimensions,
				optional: true,
			}
		: undefined;
};

// one document per act; keywords from the details table, the beginning of its text if asked,
// its vector when task embed made one
export async function documentsOf(
	publisher: string,
	year: number,
	texts = false,
) {
	const vectors = await vectorsOf(publisher, year);
	const keywords = new Map(
		store
			.readJsonl<GatheringScope.Act>(detailsTablePath(publisher, year))
			.map((details) => [details.ELI, details.keywords]),
	);
	return store
		.readJsonl<GatheringScope.Act>(store.listingPath(publisher, year))
		.map((act) => {
			const words = keywords.get(act.ELI);
			const file = join(store.DATASET_DIR, markdownPath(act));
			return {
				id: act.ELI.replace(/\//g, "-"),
				eli: act.ELI,
				title: act.title,
				type: String(act.type ?? ""),
				status: String(act.status ?? ""),
				publisher: act.publisher,
				year: act.year,
				...(act.promulgation ? { promulgation: String(act.promulgation) } : {}),
				...(Array.isArray(words) && words.length
					? { keywords: words.map(String) }
					: {}),
				...(texts && existsSync(file)
					? { text: readFileSync(file, "utf8").slice(0, TEXT_LENGTH) }
					: {}),
				...(vectors.has(act.ELI) ? { embedding: vectors.get(act.ELI) } : {}),
			};
		});
}

export async function index({ texts = false } = {}) {
	const there = await ask(`/collections/${COLLECTION}`);
	const embedding = embeddingField();
	if (there.status === 404) {
		const made = await ask("/collections", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				...SCHEMA,
				fields: [...SCHEMA.fields, ...(embedding ? [embedding] : [])],
			}),
		});
		if (!made.ok)
			throw new Error(`typesense: ${made.status} ${await made.text()}`);
	} else if (!there.ok)
		throw new Error(
			`typesense at ${TYPESENSE_URL}: ${there.status} ${await there.text()}`,
		);
	else if (embedding) {
		// a collection made before task embed: the field of vectors added, nothing indexed anew
		const { fields = [] } = (await there.json()) as {
			fields?: { name: string }[];
		};
		if (!fields.some(({ name }) => name === "embedding")) {
			const altered = await ask(`/collections/${COLLECTION}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ fields: [embedding] }),
			});
			if (!altered.ok)
				throw new Error(`typesense: ${altered.status} ${await altered.text()}`);
		}
	}

	const sum = { acts: 0, failed: 0 };
	for (const { publisher, year } of store.listedYears()) {
		const documents = await documentsOf(publisher, year, texts);
		if (!documents.length) continue;
		const answer = await ask(
			`/collections/${COLLECTION}/documents/import?action=upsert`,
			{
				method: "POST",
				headers: { "content-type": "text/plain" },
				body: documents.map((one) => JSON.stringify(one)).join("\n"),
			},
		);
		if (!answer.ok)
			throw new Error(`typesense: ${answer.status} ${await answer.text()}`);
		const results = (await answer.text()).split("\n").filter(Boolean);
		const failed = results.filter((line) => !JSON.parse(line).success);
		sum.acts += results.length - failed.length;
		sum.failed += failed.length;
		if (failed.length)
			log.warning(`${publisher}/${year}: ${failed.length} not indexed`, {
				publisher,
				year,
				first: failed[0],
			});
	}
	return sum;
}

export class SearchMissing extends Error {}

// words in titles, keywords and (when indexed) texts of every year; filters by journal,
// status, type; pages of {limit}. With meaning, the question is also a vector of the model of
// task embed, and acts are ranked by words and by meaning together (hybrid search of Typesense)
export async function search(
	query: string,
	{
		journal = "",
		status = "",
		type = "",
		page = 1,
		limit = 20,
		meaning = false,
	} = {},
): Promise<ReadingScope.SearchPage> {
	const vector = meaning ? await questionVector(query) : undefined;
	const filters = [
		journal && `publisher:=${journal}`,
		status && `status:=\`${status.replace(/`/g, "")}\``,
		type && `type:=\`${type.replace(/`/g, "")}\``,
	].filter(Boolean);
	const parameters = new URLSearchParams({
		q: query || "*",
		query_by: "title,keywords,text",
		per_page: String(Math.min(Math.max(limit, 1), 100)),
		page: String(Math.max(page, 1)),
		facet_by: "type,status,publisher",
		highlight_fields: "title,text",
		...(filters.length ? { filter_by: filters.join(" && ") } : {}),
	});
	parameters.set("exclude_fields", "embedding");
	let answer: Response;
	try {
		// a vector is too long for an address: the same search as one of multi_search
		answer = vector
			? await ask("/multi_search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						searches: [
							{
								collection: COLLECTION,
								...Object.fromEntries(parameters),
								vector_query: `embedding:([${vector.join(",")}], k:200, alpha:0.4)`,
							},
						],
					}),
				})
			: await ask(`/collections/${COLLECTION}/documents/search?${parameters}`);
	} catch {
		throw new SearchMissing(`typesense does not answer at ${TYPESENSE_URL}`);
	}
	if (answer.status === 404 || answer.status === 401)
		throw new SearchMissing(
			`typesense answers ${answer.status}: no index, or another key`,
		);
	if (!answer.ok)
		throw new Error(`typesense: ${answer.status} ${await answer.text()}`);
	const body = await answer.json();
	if (vector && body.results?.[0]?.error)
		throw new Error(
			`typesense: ${body.results[0].code} ${body.results[0].error}`,
		);
	const found = (vector ? body.results[0] : body) as {
		found: number;
		page: number;
		hits: {
			document: Record<string, unknown>;
			highlights?: { field: string; snippet?: string }[];
		}[];
		facet_counts?: {
			field_name: string;
			counts: { value: string; count: number }[];
		}[];
	};
	return {
		total: found.found,
		page: found.page,
		meaning: Boolean(vector),
		items: found.hits.map(({ document, highlights }) => ({
			ELI: String(document.eli),
			title: String(document.title),
			type: String(document.type),
			status: String(document.status),
			year: Number(document.year),
			snippet: highlights?.find((one) => one.field === "text")?.snippet,
		})),
		facets: Object.fromEntries(
			(found.facet_counts ?? []).map(({ field_name, counts }) => [
				field_name,
				counts.map(({ value, count }) => ({ value, count })),
			]),
		),
	};
}
