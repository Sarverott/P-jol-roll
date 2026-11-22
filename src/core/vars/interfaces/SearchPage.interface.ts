// an answer of /api/search: acts of every year found by Typesense, with counts per facet
export default interface SearchPage {
	total: number;
	page: number;
	meaning: boolean; // ranked by meaning too: the question became a vector (task embed, Ollama)
	items: {
		ELI: string;
		title: string;
		type: string;
		status: string;
		year: number;
		snippet?: string; // the matched words of the text marked with <mark>, when texts are indexed
	}[];
	facets: Record<string, { value: string; count: number }[]>;
}
