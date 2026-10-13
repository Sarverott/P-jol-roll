// ELI API of Sejm - open data of polish law journals, https://api.sejm.gov.pl/eli/openapi/
export const ELI_API = "https://api.sejm.gov.pl/eli";

// journal with its years - GET /acts/{publisher}
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
	[field: string]: unknown;
}

export interface YearListing {
	count: number;
	totalCount: number;
	items: Act[];
}

export const publisherUrl = (publisher: string) =>
	`${ELI_API}/acts/${publisher}`;

export const yearUrl = (publisher: string, year: number) =>
	`${ELI_API}/acts/${publisher}/${year}`;

export const pdfUrl = (act: Pick<Act, "ELI">) =>
	`${ELI_API}/acts/${act.ELI}/text.pdf`;

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
