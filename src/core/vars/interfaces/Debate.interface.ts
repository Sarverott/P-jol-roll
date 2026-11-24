import type Statement from "./Statement.interface.js";

// an act in Sejm (phase 35): the days its bill was read on, and who spoke on each
export default interface Debate {
	ELI: string;
	processes: { term: number; number: string; title: string }[];
	days: {
		term: number;
		sitting: number;
		date: string;
		stage: string; // "II czytanie na posiedzeniu Sejmu"
		decision?: string;
		gathered: boolean; // whether the statements of that day are here
		// text: its words around where it names the bill's print (or its beginning), when gathered;
		// about: whether it names one of the bill's prints
		statements: (Statement & { text?: string; about?: boolean })[];
	}[];
}
