import type { ReadingScope } from "./index.js";

// the acts counted, year by year, for the plots and the history of the law
export default interface Statistics {
	made: string; // ISO time it was counted
	years: ReadingScope.YearCount[]; // in order of journal and year
	types: string[]; // every type met, the most common first
	statuses: string[]; // every status met, the most common first
}
