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

// files of one act, named like in index of API (act_details, act_pdf, ...)
export const PARTS = ["details", "references", "pdf", "html"] as const;
export type Part = (typeof PARTS)[number];

const PART_SUFFIX: Record<Part, string> = {
	details: "",
	references: "/references",
	pdf: "/text.pdf",
	html: "/text.html",
};

export const yearUrl = (publisher: string, year: number) =>
	`${ELI_API}/acts/${publisher}/${year}`;

export const partUrl = (act: Pick<Act, "ELI">, part: Part) =>
	`${ELI_API}/acts/${act.ELI}${PART_SUFFIX[part]}`;

// listing says which texts exist - asking for the missing ones answers with empty page
export const hasPart = (
	act: Pick<Act, "textPDF" | "textHTML">,
	part: Part,
): boolean =>
	part === "pdf" ? act.textPDF : part === "html" ? act.textHTML : true;

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
