import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { edgesOf } from "../methods/compile.js";
import { markdownPath } from "../parsing/text.js";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";
import type { GatheringScope as GatheringTypes } from "../vars/types/index.js";

/*
Gathered data as readers see it: journals, acts of a year, one act with its
text and ties. Only reads resources/, never asks any API - the server, the MCP
server and every interface stand on this and nothing else.
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
	for (const { publisher, year } of store.listedYears())
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

export function act(eli: string): ReadingScope.ActView | undefined {
	const found = find(eli);
	if (!found) return undefined;
	return {
		act: found,
		details: store.readJson(store.actPath(found, ".json")),
		files: ENDINGS.filter((ending) => existsSync(store.actPath(found, ending))),
		markdown: existsSync(markdownFile(found)),
	};
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

// path of one gathered file of an act - only endings the gatherer writes
export function file(eli: string, ending: string): string | undefined {
	const found = find(eli);
	if (!found || !ENDINGS.includes(ending)) return undefined;
	const path = store.actPath(found, ending);
	return existsSync(path) ? path : undefined;
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
