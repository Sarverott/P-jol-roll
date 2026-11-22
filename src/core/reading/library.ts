import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { edgesOf } from "../methods/compile.js";
import { markdownPath, textsTablePath } from "../parsing/text.js";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";
import type { GatheringScope as GatheringTypes } from "../vars/types/index.js";
import * as remote from "./remote.js";

/*
Gathered data as readers see it: journals, acts of a year, one act with its
text and ties. Only reads resources/, never asks any API - the server, the MCP
server and every interface stand on this and nothing else. In the remote mode
(remote.ts, the demo) resources/ is a cache that prepare() fills first from the
copies on Hugging Face; raw files are then addresses on the bucket.
*/

// "DU/2026/1" -> its parts, or nothing when it is not an ELI of a journal
export function parseEli(eli: string) {
	const match = /^([A-Z]{2,4})\/(\d{4})\/(\d{1,6})$/.exec(eli.trim());
	if (!match) return undefined;
	return {
		publisher: match[1],
		year: Number(match[2]),
		pos: Number(match[3]),
	};
}

// listings are read again only when their file changed
const listings = new Map<
	string,
	{ mtime: number; acts: GatheringScope.Act[] }
>();

function listing(publisher: string, year: number) {
	const path = store.listingPath(publisher, year);
	if (!existsSync(path)) return [];
	const mtime = statSync(path).mtimeMs;
	const known = listings.get(path);
	if (known?.mtime === mtime) return known.acts;
	const acts = store.readJsonl<GatheringScope.Act>(path);
	listings.set(path, { mtime, acts });
	return acts;
}

export function journals(): ReadingScope.Journal[] {
	const names = new Map(
		(
			store.readJson<GatheringScope.Publisher[]>(
				store.listPath("publishers"),
			) ?? []
		).map((publisher) => [publisher.code, publisher.name]),
	);
	const found = new Map<string, number[]>();
	// remotely the years are those the journals have: the dataset has the acts of each
	const years = remote.remote
		? (
				store.readJson<GatheringScope.Publisher[]>(
					store.listPath("publishers"),
				) ?? []
			).flatMap((journal) =>
				(journal.years ?? []).map((year) => ({
					publisher: journal.code,
					year,
				})),
			)
		: store.listedYears();
	for (const { publisher, year } of years)
		found.set(publisher, [...(found.get(publisher) ?? []), year]);
	return [...found].map(([code, years]) => ({
		code,
		name: names.get(code),
		years,
	}));
}

// acts of a year whose title has every word of the query, in order of positions
export function acts(
	publisher: string,
	year: number,
	{ query = "", offset = 0, limit = 50 } = {},
): ReadingScope.ActPage {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	const matching = listing(publisher, year).filter((act) => {
		const title = String(act.title).toLowerCase();
		return words.every((word) => title.includes(word));
	});
	return {
		total: matching.length,
		offset,
		items: matching.slice(offset, offset + Math.min(limit, 500)),
	};
}

export function find(eli: string): GatheringScope.Act | undefined {
	const parsed = parseEli(eli);
	if (!parsed) return undefined;
	return listing(parsed.publisher, parsed.year).find(
		(act) => act.pos === parsed.pos,
	);
}

// endings of files that the gatherer can leave in the bucket for an act
const ENDINGS = [
	".json",
	".references.json",
	".pdf",
	".html",
	".struct.json",
	".T.pdf",
	".U.pdf",
];

// endings of the files of an act that are gathered: here, what is on disk; remotely, what
// the records of the dataset (files/) name, or else what the listing says the act has
function endings(found: GatheringScope.Act) {
	if (!remote.remote)
		return ENDINGS.filter((ending) => existsSync(store.actPath(found, ending)));
	const records = store.sealed(found.publisher, found.year);
	if (records.size)
		return ENDINGS.filter((ending) =>
			records.has(store.bucketPath(found, ending)),
		);
	return [
		".json",
		...(found.textPDF ? [".pdf"] : []),
		...(found.textHTML ? [".html"] : []),
	];
}

export function act(eli: string): ReadingScope.ActView | undefined {
	const found = find(eli);
	if (!found) return undefined;
	return {
		act: found,
		details: store.readJson(store.actPath(found, ".json")),
		files: endings(found),
		markdown: existsSync(markdownFile(found)),
		text: origin(found),
	};
}

// the record of the act's markdown in texts/: from HTML, or from the PDF (phase 12)
function origin(
	found: GatheringScope.Act,
): ReadingScope.TextOrigin | undefined {
	const record = store
		.readJsonl<GatheringScope.TextRecord>(
			textsTablePath(found.publisher, found.year),
		)
		.find(({ ELI }) => ELI === found.ELI);
	if (!record) return undefined;
	return {
		from: record.from ?? "html",
		...(record.producer ? { producer: record.producer } : {}),
		url: record.url,
	};
}

export function textOrigin(eli: string) {
	const found = find(eli);
	return found ? origin(found) : undefined;
}

const markdownFile = (act: GatheringTypes.ActAddress) =>
	join(store.DATASET_DIR, markdownPath(act));

// markdown made by "task text", or nothing when it is not made yet
export function text(eli: string): string | undefined {
	const found = find(eli);
	if (!found) return undefined;
	const path = markdownFile(found);
	return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

// path of one gathered file of an act - only endings the gatherer writes; remotely its
// address on the bucket
export function file(eli: string, ending: string): string | undefined {
	const found = find(eli);
	if (!found || !ENDINGS.includes(ending)) return undefined;
	if (remote.remote)
		return endings(found).includes(ending)
			? remote.bucketUrl(store.bucketPath(found, ending))
			: undefined;
	const path = store.actPath(found, ending);
	return existsSync(path) ? path : undefined;
}

// remote mode: the files a reader of this address needs, taken before it is read
// (journals; acts of a year; one act with its records, details and markdown)
export async function prepare(journal?: string, year?: number, pos?: number) {
	if (!remote.remote) return;
	await remote.fromDataset("lists/publishers.json");
	if (!journal || !year) return;
	await remote.fromDataset(`acts/${journal}/${year}.jsonl`);
	if (pos === undefined) return;
	const found = find(`${journal}/${year}/${pos}`);
	if (!found) return;
	await Promise.all([
		remote.fromDataset(`files/${journal}/${year}.jsonl`),
		remote.fromBucket(store.bucketPath(found, ".json")),
		remote.fromDataset(markdownPath(found)),
		remote.fromDataset(`texts/${journal}/${year}.jsonl`),
	]);
}

// ties named in details of the act: what it changes, repeals, carries out
export function references(eli: string) {
	const found = find(eli);
	if (!found) return undefined;
	const details = store.readJson<{
		references?: GatheringTypes.References;
	}>(store.actPath(found, ".json"));
	return edgesOf(found.ELI, details?.references);
}
