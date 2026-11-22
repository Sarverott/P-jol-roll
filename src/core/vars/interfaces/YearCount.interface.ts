// the acts of one year of a journal, counted: all, by type and by status
export default interface YearCount {
	journal: string; // "DU"
	year: number;
	total: number;
	types: Record<string, number>;
	statuses: Record<string, number>;
}
