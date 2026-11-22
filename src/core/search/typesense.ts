import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import log from "../logging/setup.js";
import { detailsTablePath } from "../methods/compile.js";
import { markdownPath } from "../parsing/text.js";
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

// one document per act; keywords from the details table, the beginning of its text if asked
export function documentsOf(publisher: string, year: number, texts = false) {
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
			};
		});
}

export async function index({ texts = false } = {}) {
	const there = await ask(`/collections/${COLLECTION}`);
	if (there.status === 404) {
		const made = await ask("/collections", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(SCHEMA),
		});
		if (!made.ok)
			throw new Error(`typesense: ${made.status} ${await made.text()}`);
	} else if (!there.ok)
		throw new Error(
			`typesense at ${TYPESENSE_URL}: ${there.status} ${await there.text()}`,
		);

	const sum = { acts: 0, failed: 0 };
	for (const { publisher, year } of store.listedYears()) {
		const documents = documentsOf(publisher, year, texts);
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
// status, type; pages of {limit}
export async function search(
	query: string,
	{ journal = "", status = "", type = "", page = 1, limit = 20 } = {},
): Promise<ReadingScope.SearchPage> {
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
	let answer: Response;
	try {
		answer = await ask(
			`/collections/${COLLECTION}/documents/search?${parameters}`,
		);
	} catch {
		throw new SearchMissing(`typesense does not answer at ${TYPESENSE_URL}`);
	}
	if (answer.status === 404 || answer.status === 401)
		throw new SearchMissing(
			`typesense answers ${answer.status}: no index, or another key`,
		);
	if (!answer.ok)
		throw new Error(`typesense: ${answer.status} ${await answer.text()}`);
	const found = (await answer.json()) as {
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
