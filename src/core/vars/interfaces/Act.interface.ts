// one position of journal as it is listed in GET /acts/{publisher}/{year}
export default interface Act {
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
