import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHttpRouter } from "crawlee";
import { type Asked, crawl } from "./crawl.js";
import * as store from "./store.js";

/*
How a statute was made: API of Sejm's work, https://api.sejm.gov.pl/sejm/openapi/
Legislative processes carry ELI of the act they ended with, and prints carry
drafts with justifications written by their authors. It is another source,
so it has its own directories, apart from the journals.
*/
export const SEJM_API = process.env.SEJM_API ?? "https://api.sejm.gov.pl/sejm";
export const SEJM_DATASET = join(store.RESOURCES_DIR, "sejm-dataset");
export const SEJM_BUCKET = join(store.RESOURCES_DIR, "sejm-bucket");

// processes are given in pages, prints of a term in one answer
const PAGE = 500;

export interface Term {
	num: number;
	current: boolean;
	from: string;
	to?: string;
	prints?: { count: number };
}

export interface Process {
	term: number;
	number: string; // number of the print that started it
	title: string;
	ELI?: string; // act that came out of it
	[field: string]: unknown;
}

export interface Print {
	term: number;
	number: string;
	title: string;
	attachments?: string[]; // names of files: draft, justification, opinions
	[field: string]: unknown;
}

export interface SejmPlan {
	terms: number[]; // empty means the current one
	all: boolean; // every term
	files: boolean; // details of processes and attachments of prints
	limit: number; // how many files one run may take, 0 means no limit
	rate: number;
}

const usable = (name: string) =>
	/^[\w.() -]+$/.test(name) && !name.startsWith(".");

export const termsPath = () => join(SEJM_DATASET, "terms.json");
export const tablePath = (term: number, name: "processes" | "prints") =>
	join(SEJM_DATASET, `term${term}`, `${name}.jsonl`);
export const processPath = (term: number, number: string) =>
	join(SEJM_BUCKET, `term${term}`, "processes", `${number}.json`);
export const attachmentPath = (term: number, number: string, name: string) =>
	join(SEJM_BUCKET, `term${term}`, "prints", number, name);

export const pickTerms = (available: Term[], wanted: number[], all: boolean) =>
	available
		.filter(
			({ num, current }) =>
				all || (wanted.length ? wanted.includes(num) : current),
		)
		.map(({ num }) => num);

// files of term that are not here yet, with addresses they come from
export function missingFiles(term: number): (Asked & { path: string })[] {
	const processes = store
		.readJsonl<Process>(tablePath(term, "processes"))
		.filter(({ number }) => usable(number))
		.map(({ number }) => ({
			url: `${SEJM_API}/term${term}/processes/${number}`,
			path: processPath(term, number),
		}));
	const attachments = store
		.readJsonl<Print>(tablePath(term, "prints"))
		.filter(({ number }) => usable(number))
		.flatMap(({ number, attachments = [] }) =>
			attachments.filter(usable).map((name) => ({
				url: `${SEJM_API}/term${term}/prints/${number}/${encodeURIComponent(name)}`,
				path: attachmentPath(term, number, name),
			})),
		);
	return [...processes, ...attachments]
		.filter(({ path }) => !existsSync(path))
		.map(({ url, path }) => ({ url, path, userData: { path } }));
}

export async function sejm(plan: SejmPlan) {
	const router = createHttpRouter();
	const terms: number[] = [];
	const pages = new Map<number, Process[]>();

	router.addHandler("terms", async ({ json, log, addRequests }) => {
		await store.saveJson(termsPath(), json);
		terms.push(...pickTerms(json as Term[], plan.terms, plan.all));
		log.info(`terms: ${terms}`);
		await addRequests(
			terms.flatMap((term) => [
				{
					url: `${SEJM_API}/term${term}/prints`,
					label: "prints",
					userData: { term },
				},
				{
					url: `${SEJM_API}/term${term}/processes?limit=${PAGE}&offset=0`,
					label: "processes",
					userData: { term, offset: 0 },
				},
			]),
		);
	});

	router.addHandler("prints", async ({ request, json, log }) => {
		const { term } = request.userData;
		await store.saveJsonl(tablePath(term, "prints"), json as Print[]);
		log.info(`term ${term}: ${(json as Print[]).length} prints`);
	});

	// table is written when the last page arrives, so it is never a half of itself
	router.addHandler(
		"processes",
		async ({ request, json, log, addRequests }) => {
			const { term, offset } = request.userData;
			const page = json as Process[];
			const all = [...(pages.get(term) ?? []), ...page];
			pages.set(term, all);
			if (page.length === PAGE) {
				await addRequests([
					{
						url: `${SEJM_API}/term${term}/processes?limit=${PAGE}&offset=${offset + PAGE}`,
						label: "processes",
						userData: { term, offset: offset + PAGE },
					},
				]);
				return;
			}
			await store.saveJsonl(tablePath(term, "processes"), all);
			log.info(`term ${term}: ${all.length} processes`);
		},
	);

	await crawl([{ url: `${SEJM_API}/term`, label: "terms" }], router, plan.rate);
	if (!plan.files) return;

	const files = createHttpRouter();
	files.addDefaultHandler(async ({ request, response, json, body, log }) => {
		const { path } = request.userData;
		if (response.statusCode === 404) {
			log.warning(`${request.url}: source does not have it`);
			return;
		}
		if (response.statusCode !== 200)
			throw new Error(`${request.url}: status ${response.statusCode}`);
		const content = path.endsWith(".json")
			? store.jsonText(json)
			: Buffer.from(body);
		if (!content.length) throw new Error(`${request.url} is empty`);
		await store.writeWhole(path, content);
		log.info(path);
	});

	let left = plan.limit || Number.POSITIVE_INFINITY;
	for (const term of terms) {
		if (left <= 0) break;
		const missing = missingFiles(term).slice(0, left);
		left -= missing.length;
		if (missing.length) await crawl(missing, files, plan.rate);
	}
}
