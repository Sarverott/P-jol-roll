import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { monthPath, SAOS_DATASET } from "../apihandlers/saos.js";
import { SEJM_DATASET, tablePath } from "../apihandlers/sejm.js";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";
import * as remote from "./remote.js";

/*
The rest of the dataset as readers see it (phase 22): the work of Sejm, court judgments, the
lists of the source and the acts counted year by year. Like library.ts it only reads
resources/; in the remote mode prepareDataset() takes the files from Hugging Face first.
*/

const PAGE_MOST = 500;

// a page of lines whose title (or any text field) has every word of the query
function paged<Item extends Record<string, unknown>>(
	lines: Item[],
	{ query = "", offset = 0, limit = 50 } = {},
): ReadingScope.Page<Item> {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	const matching = words.length
		? lines.filter((line) => {
				const text = JSON.stringify(line).toLowerCase();
				return words.every((word) => text.includes(word));
			})
		: lines;
	return {
		total: matching.length,
		offset,
		items: matching.slice(offset, offset + Math.min(limit, PAGE_MOST)),
	};
}

// tables are read again only when their file changed
const tables = new Map<string, { mtime: number; lines: unknown[] }>();
function table<Line>(path: string): Line[] {
	if (!existsSync(path)) return [];
	const mtime = statSync(path).mtimeMs;
	const known = tables.get(path);
	if (known?.mtime === mtime) return known.lines as Line[];
	const lines = store.readJsonl<Line>(path);
	tables.set(path, { mtime, lines });
	return lines;
}

// the work of Sejm: terms gathered here, with how many processes and prints each has
export function terms() {
	if (!existsSync(SEJM_DATASET)) return [];
	return readdirSync(SEJM_DATASET)
		.map((name) => /^term(\d+)$/.exec(name)?.[1])
		.filter((term): term is string => Boolean(term))
		.map(Number)
		.sort((a, b) => a - b)
		.map((term) => ({
			term,
			processes: table(tablePath(term, "processes")).length,
			prints: table(tablePath(term, "prints")).length,
		}));
}

export const SEJM_KINDS = ["processes", "prints"] as const;

// processes or prints of a term, by words
export function sejmWork(
	term: number,
	kind: (typeof SEJM_KINDS)[number],
	paging: { query?: string; offset?: number; limit?: number } = {},
) {
	const lines =
		kind === "processes"
			? table<GatheringScope.Process>(tablePath(term, "processes"))
			: table<GatheringScope.Print>(tablePath(term, "prints"));
	return paged(lines, paging);
}

// court judgments of SAOS: the months gathered here, and one month in pages
export function judgmentMonths() {
	const root = join(SAOS_DATASET, "judgments");
	if (!existsSync(root)) return [];
	return readdirSync(root)
		.filter((year) => /^\d{4}$/.test(year))
		.flatMap((year) =>
			readdirSync(join(root, year))
				.map((name) => /^(\d{4})-(\d{2})\.jsonl$/.exec(name))
				.filter((match) => match !== null)
				.map((match) => `${match[1]}-${match[2]}`),
		)
		.sort();
}

export function judgments(
	year: number,
	month: number,
	paging: { query?: string; offset?: number; limit?: number } = {},
) {
	return paged(table<GatheringScope.Judgment>(monthPath(year, month)), paging);
}

// the lists of the source (dataset/lists): their names, and one of them
const LIST = /^[a-z_]{1,40}$/;
export function lists() {
	const dir = join(store.DATASET_DIR, "lists");
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.map((name) => /^([a-z_]+)\.json$/.exec(name)?.[1])
		.filter((name): name is string => Boolean(name) && name !== "index");
}

export function list(name: string): unknown {
	if (!LIST.test(name)) return undefined;
	return store.readJson(store.listPath(name));
}

// the acts counted year by year; counted again only when a listing changed, and in the
// remote mode read from dataset/statistics/acts.json (task stats writes it)
let counted: { signature: string; statistics?: ReadingScope.Statistics } = {
	signature: "",
};
export const statisticsPath = () =>
	join(store.DATASET_DIR, "statistics", "acts.json");

export function statistics(): ReadingScope.Statistics {
	if (remote.remote)
		return (
			store.readJson<ReadingScope.Statistics>(statisticsPath()) ?? {
				made: "",
				years: [],
				types: [],
				statuses: [],
			}
		);
	const years = store.listedYears();
	const signature = years
		.map(
			({ publisher, year }) =>
				`${publisher}${year}:${statSync(store.listingPath(publisher, year)).mtimeMs}`,
		)
		.join();
	if (counted.statistics && counted.signature === signature)
		return counted.statistics;
	const types = new Map<string, number>();
	const statuses = new Map<string, number>();
	const counts = years.map(({ publisher, year }) => {
		const one: ReadingScope.YearCount = {
			journal: publisher,
			year,
			total: 0,
			types: {},
			statuses: {},
		};
		for (const act of table<GatheringScope.Act>(
			store.listingPath(publisher, year),
		)) {
			const type = String(act.type ?? "");
			const status = String(act.status ?? "");
			one.total++;
			one.types[type] = (one.types[type] ?? 0) + 1;
			one.statuses[status] = (one.statuses[status] ?? 0) + 1;
			types.set(type, (types.get(type) ?? 0) + 1);
			statuses.set(status, (statuses.get(status) ?? 0) + 1);
		}
		return one;
	});
	const common = (seen: Map<string, number>) =>
		[...seen].sort((a, b) => b[1] - a[1]).map(([name]) => name);
	const statistics: ReadingScope.Statistics = {
		made: new Date().toISOString(),
		years: counts.sort(
			(a, b) => a.journal.localeCompare(b.journal) || a.year - b.year,
		),
		types: common(types),
		statuses: common(statuses),
	};
	counted = { signature, statistics };
	return statistics;
}

// remote mode: what a reader of these parts needs, taken first
export async function prepareDataset(
	kind: string,
	first?: string,
	second?: string,
) {
	if (!remote.remote) return;
	if (kind === "statistics") {
		await remote.fromDataset("statistics/acts.json");
	} else if (kind === "lists") {
		const name = first && LIST.test(first) ? first : "index";
		await remote.fromDataset(`lists/${name}.json`);
	} else if (kind === "sejm" && first && /^\d{1,2}$/.test(first)) {
		for (const name of SEJM_KINDS)
			if (!second || second === name)
				await remote.fromDataset(`sejm/term${first}/${name}.jsonl`);
	} else if (kind === "eu" && first && /^\d{4}$/.test(first)) {
		await remote.fromDataset(`EU/acts/${first}.jsonl`);
	} else if (kind === "regional") {
		await remote.fromDataset("regional/journals.json");
		if (
			first &&
			/^[A-Z][A-Z0-9_]{1,30}$/.test(first) &&
			second &&
			/^\d{4}$/.test(second)
		)
			await remote.fromDataset(`regional/${first}/${second}.jsonl`);
	} else if (
		kind === "tenders" &&
		first &&
		/^(BZP|TED)$/.test(first) &&
		second &&
		/^\d{4}-\d{2}-\d{2}$/.test(second)
	) {
		await remote.fromDataset(
			`tenders/${first}/${second.slice(0, 4)}/${second}.jsonl`,
		);
	} else if (kind === "transparency") {
		await remote.fromDataset("transparency/offices.jsonl");
		await remote.fromDataset("transparency/networks.jsonl");
	} else if (kind === "agreements") {
		await remote.fromDataset("international/agreements.jsonl");
	} else if (kind === "analysis") {
		await remote.fromDataset("analysis/summary.json");
		await remote.fromDataset("analysis/findings.jsonl");
	} else if (kind === "judgments" && first && /^\d{4}$/.test(first) && second) {
		await remote.fromDataset(
			`SAOS/judgments/${first}/${first}-${second.padStart(2, "0")}.jsonl`,
		);
	}
}

/*
The code of law analysed (phase 36, task analyse writes dataset/analysis/): how many findings of
each kind, a page of one kind, and the findings of one act.
*/
const ANALYSIS = () => join(store.DATASET_DIR, "analysis");
export const FINDING_KINDS = [
	"basis-repealed",
	"reference-repealed",
	"consolidation-due",
	"tribunal",
] as const;

export function analysis(): ReadingScope.Analysis | undefined {
	return store.readJson<ReadingScope.Analysis>(
		join(ANALYSIS(), "summary.json"),
	);
}

export function findingsOf(
	kind: string,
	paging: { query?: string; offset?: number; limit?: number } = {},
) {
	const lines = table<ReadingScope.Finding>(
		join(ANALYSIS(), "findings.jsonl"),
	).filter((one) => !kind || one.kind === kind);
	return paged(lines, paging);
}

export function findings(eli: string): ReadingScope.Finding[] {
	return table<ReadingScope.Finding>(join(ANALYSIS(), "findings.jsonl")).filter(
		(one) => one.ELI === eli,
	);
}

/*
International law (phase 42): the law of the EU by year (task eu) - its acts, one with its Polish
text as markdown when the bucket has it - and the international agreements the journals of the
state published (task international).
*/
const EU = () => join(store.DATASET_DIR, "EU", "acts");

export function euYears() {
	if (!existsSync(EU())) return [];
	return readdirSync(EU())
		.map((name) => /^(\d{4})\.jsonl$/.exec(name)?.[1])
		.filter((year): year is string => Boolean(year))
		.map(Number)
		.sort((a, b) => a - b)
		.map((year) => ({ year, acts: table(join(EU(), `${year}.jsonl`)).length }));
}

export function euActs(
	year: number,
	paging: {
		query?: string;
		offset?: number;
		limit?: number;
		inForce?: boolean;
	} = {},
) {
	const lines = table<GatheringScope.EuAct>(join(EU(), `${year}.jsonl`)).filter(
		(act) => !paging.inForce || act.inForce,
	);
	return paged(
		lines as (GatheringScope.EuAct & Record<string, unknown>)[],
		paging,
	);
}

const CELEX = /^([0-9])([0-9]{4})[A-Z]{1,2}[0-9A-Z()_/-]{1,20}$/;

export async function euAct(celex: string, length = 20000) {
	const found = CELEX.exec(celex);
	if (!found) return undefined;
	const year = Number(found[2]);
	if (remote.remote) await remote.fromDataset(`EU/acts/${year}.jsonl`);
	const act = table<GatheringScope.EuAct>(join(EU(), `${year}.jsonl`)).find(
		(one) => one.CELEX === celex,
	);
	if (!act) return undefined;
	// the year of the document may differ from the year in its CELEX: both are looked in
	const file = [year, Number(act.date.slice(0, 4))]
		.map((one) =>
			join(
				store.BUCKET_DIR,
				"EU",
				String(one),
				`${celex.replace(/\//g, "_")}.xhtml`,
			),
		)
		.find((path) => existsSync(path));
	let text = "";
	if (file) {
		const { toMarkdown } = await import("../parsing/text.js");
		text = toMarkdown(readFileSync(file, "utf8")).slice(0, length);
	}
	return {
		act,
		text,
		eurlex: `https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:${celex}`,
	};
}

export function agreements(
	paging: {
		query?: string;
		offset?: number;
		limit?: number;
		type?: string;
	} = {},
) {
	const lines = table<Record<string, unknown>>(
		join(store.DATASET_DIR, "international", "agreements.jsonl"),
	).filter((one) => !paging.type || one.type === paging.type);
	return paged(lines, paging);
}

/*
Local and regional law and public tenders (phase 43): the voivodeships' journals (task regional)
- which answer, their years, a year's acts - and the notices of e-Zamówienia and TED by day
(task tenders).
*/
export function regionalJournals() {
	return (
		store.readJson<Record<string, unknown>[]>(
			join(store.DATASET_DIR, "regional", "journals.json"),
		) ?? []
	);
}

export function regionalActs(
	code: string,
	year: number,
	paging: { query?: string; offset?: number; limit?: number } = {},
) {
	if (!/^[A-Z][A-Z0-9_]{1,30}$/.test(code)) return paged([], paging);
	return paged(
		table<Record<string, unknown>>(
			join(store.DATASET_DIR, "regional", code, `${year}.jsonl`),
		),
		paging,
	);
}

export function tenderDays(source: "BZP" | "TED") {
	const root = join(store.DATASET_DIR, "tenders", source);
	if (!existsSync(root)) return [];
	return readdirSync(root)
		.filter((year) => /^\d{4}$/.test(year))
		.flatMap((year) =>
			readdirSync(join(root, year))
				.map((name) => /^(\d{4}-\d{2}-\d{2})\.jsonl$/.exec(name)?.[1])
				.filter((day): day is string => Boolean(day)),
		)
		.sort();
}

export function tenders(
	source: "BZP" | "TED",
	day: string,
	paging: { query?: string; offset?: number; limit?: number } = {},
) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return paged([], paging);
	return paged(
		table<Record<string, unknown>>(
			join(
				store.DATASET_DIR,
				"tenders",
				source,
				day.slice(0, 4),
				`${day}.jsonl`,
			),
		),
		paging,
	);
}

/*
The declaration of transparency (phase 44, the Python stack's pjolroll offices / geocode /
networks): every public office with its official contacts and its place, and the address space
of the state in the RIPE database.
*/
export function offices(
	paging: {
		query?: string;
		offset?: number;
		limit?: number;
		kind?: string;
	} = {},
) {
	return paged(
		table<Record<string, unknown>>(
			join(store.DATASET_DIR, "transparency", "offices.jsonl"),
		).filter((one) => !paging.kind || one.kind === paging.kind),
		paging,
	);
}

export function networks(
	paging: { query?: string; offset?: number; limit?: number } = {},
) {
	return paged(
		table<Record<string, unknown>>(
			join(store.DATASET_DIR, "transparency", "networks.jsonl"),
		),
		paging,
	);
}
