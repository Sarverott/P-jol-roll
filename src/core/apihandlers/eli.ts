// ELI API of Sejm - open data of polish law journals, https://api.sejm.gov.pl/eli/openapi/
// address can be replaced to gather from a copy or from a test server
export const ELI_API = process.env.ELI_API ?? "https://api.sejm.gov.pl/eli";

// answer of GET / - names of everything that API gives, with addresses
export type Index = Record<string, string>;

// journal with its years - one entry of GET /acts
export interface Publisher {
	code: string; // "DU" for Dziennik Ustaw, "MP" for Monitor Polski
	name: string;
	actsCount: number;
	years: number[];
}

// one position of journal as it is listed in GET /acts/{publisher}/{year}
export interface Act {
	ELI: string; // "DU/2026/1"
	address: string; // "WDU20260000001"
	publisher: string;
	year: number;
	pos: number;
	title: string;
	textPDF: boolean;
	textHTML: boolean;
	[field: string]: unknown;
}

export interface YearListing {
	count: number;
	totalCount: number;
	items: Act[];
}

// answer of GET /changes/acts - a page of acts with their details
export interface Changes extends YearListing {
	offset: number;
}

// one text of act as details list it: O is the published one (the same file as text.pdf),
// H is html; T and U are other wordings kept by Sejm - meaning of letters is not documented
export interface ActText {
	fileName: string;
	type: string;
}

// files of one act; "texts" are these texts from details that are neither text.pdf nor text.html
export const PARTS = [
	"details",
	"references",
	"pdf",
	"html",
	"struct",
	"texts",
] as const;
export type Part = (typeof PARTS)[number];

// one file to take: where to ask and how its name ends after address of act
export interface ActFile {
	part: Part;
	url: string;
	suffix: string;
}

export const yearUrl = (publisher: string, year: number) =>
	`${ELI_API}/acts/${publisher}/${year}`;

// acts that were changed since date ("2026-10-12" or "2026-10-12T09:15:19"), newest change last
export const CHANGES_PAGE = 500;
export const changesUrl = (since: string, offset: number) =>
	`${ELI_API}/changes/acts?since=${encodeURIComponent(since)}&limit=${CHANGES_PAGE}&offset=${offset}`;

type Listed = Pick<Act, "ELI" | "textPDF" | "textHTML">;

// listing says which texts exist - asking for the missing ones answers with empty page,
// and structure is given only to acts that have html
export function filesOf(act: Listed, part: Part, texts?: ActText[]): ActFile[] {
	const base = `${ELI_API}/acts/${act.ELI}`;
	const one = (path: string, suffix: string) => [
		{ part, url: `${base}${path}`, suffix },
	];
	if (part === "details") return one("", ".json");
	if (part === "references") return one("/references", ".references.json");
	if (part === "pdf") return act.textPDF ? one("/text.pdf", ".pdf") : [];
	if (part === "html") return act.textHTML ? one("/text.html", ".html") : [];
	if (part === "struct")
		return act.textHTML ? one("/struct", ".struct.json") : [];

	// texts are named in details, so details have to be here first
	const published = texts?.find(({ type }) => type === "O")?.fileName;
	const names = new Set([published]);
	return (texts ?? []).flatMap(({ fileName, type }) => {
		if (type === "H" || names.has(fileName) || !/^[\w.-]+$/.test(fileName))
			return [];
		names.add(fileName);
		const extension = fileName.slice(fileName.lastIndexOf("."));
		return one(`/text/${type}/${fileName}`, `.${type}${extension}`);
	});
}

// "list_statuses" -> "statuses"; addresses with {placeholders} are not lists
export function pickLists(index: Index): { name: string; url: string }[] {
	return Object.entries(index)
		.filter(([key, url]) => key.startsWith("list_") && !url.includes("{"))
		.map(([key, url]) => ({ name: key.replace("list_", ""), url }));
}

// journals to gather: these that were asked for, or every one
export function pickPublishers(
	available: Publisher[],
	wanted: string[],
): Publisher[] {
	if (!wanted.length) return available;
	return available.filter(({ code }) => wanted.includes(code));
}

// years to gather: all of them, these that were asked for, or only the newest one
export function pickYears(
	available: number[],
	wanted: number[],
	all: boolean,
): number[] {
	if (all) return available;
	if (wanted.length) return wanted.filter((year) => available.includes(year));
	return available.slice(-1);
}
