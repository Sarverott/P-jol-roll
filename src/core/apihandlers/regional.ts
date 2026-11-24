import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHttpRouter } from "crawlee";
import { parse } from "yaml";
import { crawl, USER_AGENT } from "../crawl.js";
import { ROOT } from "../paths/at.js";
import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";

/*
Local and regional law (phase 43, Q23): the official journals of the sixteen voivodeships, whose
platform answers as the ELI API of the Sejm does -
  https://<host>/api/eli/acts                       the journal: its code, its years, its acts counted
  https://<host>/api/eli/acts/<code>/<year>          every act of a year
  https://<host>/api/eli/acts/<code>/<year>/<pos>/text.pdf   (and text.html) its text
Kept beside the journals of the state:
  dataset/regional/journals.json           every journal: whether it answered, its code and years,
                                           and why not when it did not (a certificate, a timeout)
  dataset/regional/<code>/<year>.jsonl     an act per line, as the journal lists it
  bucket/regional/<code>/<year>/<address>.pdf
The registry is resources/configs/regional/journals.yaml (REGIONAL_JOURNALS for another).
*/

export const REGIONAL_DATASET = join(store.DATASET_DIR, "regional");
export const REGIONAL_BUCKET = join(store.BUCKET_DIR, "regional");
const CODE = /^[A-Z][A-Z0-9_]{1,30}$/;
const HOST = /^[a-z0-9.-]+(:\d+)?$/;

export type Journal = { voivodeship: string; host: string; code?: string };
export type JournalState = Journal & {
	answers: boolean;
	years?: number[];
	acts?: number;
	error?: string;
};

export const journalsPath = () => join(REGIONAL_DATASET, "journals.json");
export const yearPath = (code: string, year: number) =>
	join(REGIONAL_DATASET, code, `${year}.jsonl`);
export const pdfPath = (code: string, year: number, address: string) =>
	join(REGIONAL_BUCKET, code, String(year), `${address}.pdf`);

// http for a host with a port (the tests' copy), https for the journals
const base = (host: string) =>
	`${/:\d+$/.test(host) ? "http" : "https"}://${host}/api/eli/acts`;

export function journals(): Journal[] {
	const file =
		process.env.REGIONAL_JOURNALS ??
		join(ROOT, "resources", "configs", "regional", "journals.yaml");
	return (
		parse(readFileSync(file, "utf8")) as { journals: Journal[] }
	).journals.filter((one) => HOST.test(one.host));
}

// each journal asked what it is - one request each, its failure kept as it was said
export async function survey(list = journals()): Promise<JournalState[]> {
	const states: JournalState[] = [];
	for (const journal of list) {
		try {
			const answer = await fetch(base(journal.host), {
				headers: { "user-agent": USER_AGENT, accept: "application/json" },
				signal: AbortSignal.timeout(30_000),
			});
			const said = answer.ok
				? ((await answer.json().catch(() => null)) as
						| { code?: string; years?: number[]; deedsCount?: number }[]
						| null)
				: null;
			const first = Array.isArray(said) ? said[0] : undefined;
			if (!first?.code || !CODE.test(first.code))
				states.push({
					...journal,
					answers: false,
					error: answer.ok
						? "answers, but not as the ELI API"
						: `status ${answer.status}`,
				});
			else
				states.push({
					...journal,
					code: first.code,
					answers: true,
					years: first.years ?? [],
					acts: first.deedsCount ?? 0,
				});
		} catch (error) {
			const cause = (error as { cause?: { code?: string; message?: string } })
				.cause;
			states.push({
				...journal,
				answers: false,
				error: cause?.code ?? cause?.message ?? (error as Error).message,
			});
		}
		await new Promise((done) => setTimeout(done, 500));
	}
	await store.saveJson(journalsPath(), states);
	return states;
}

export async function regional(plan: {
	codes: string[];
	years: number[];
	files: boolean;
	limit: number;
	rate: number;
}) {
	const states = (await survey()).filter(
		(one) =>
			one.answers &&
			one.code &&
			(!plan.codes.length || plan.codes.includes(one.code)),
	);
	const router = createHttpRouter();
	router.addDefaultHandler(async ({ request, response, json, body, log }) => {
		const { path, list } = request.userData;
		if (response.statusCode === 404) return;
		if (response.statusCode !== 200)
			throw new Error(`${request.url}: status ${response.statusCode}`);
		if (list) {
			const items = (json as { items?: GatheringScope.Act[] })?.items ?? [];
			await store.saveJsonl(path, items);
			log.info(`${path}: ${items.length} acts`);
			return;
		}
		const content = Buffer.from(body);
		if (!content.length) throw new Error(`${request.url} is empty`);
		await store.writeWhole(path, content);
	});
	const lists = states.flatMap((journal) => {
		const years = plan.years.length
			? plan.years.filter((year) => journal.years?.includes(year))
			: (journal.years ?? []).slice(-1);
		return years.map((year) => ({
			url: `${base(journal.host)}/${journal.code}/${year}`,
			userData: { path: yearPath(journal.code as string, year), list: true },
		}));
	});
	await crawl(lists, router, plan.rate, { timeout: 120 });
	if (!plan.files) return states;
	const files = states
		.flatMap((journal) =>
			lists
				.filter(({ url }) => url.startsWith(`${base(journal.host)}/`))
				.flatMap(({ userData }) =>
					store
						.readJsonl<GatheringScope.Act>(userData.path)
						.filter(
							(act) =>
								act.textPDF &&
								/^[A-Za-z0-9_]+$/.test(act.address) &&
								Number.isInteger(act.pos),
						)
						.map((act) => ({
							url: `${base(journal.host)}/${journal.code}/${act.year}/${act.pos}/text.pdf`,
							userData: {
								path: pdfPath(journal.code as string, act.year, act.address),
							},
						})),
				),
		)
		.filter(({ userData }) => !existsSync(userData.path))
		.slice(0, plan.limit || undefined);
	if (files.length) await crawl(files, router, plan.rate);
	return states;
}
