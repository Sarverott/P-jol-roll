// what a function of the catalog takes: asked by the launcher one by one, a field of the
// viewer, a word of the REPL and of "task do"
export default interface Parameter {
	name: string; // "year"
	title: string; // what it is, in plain words
	kind: "text" | "number" | "flag" | "choice";
	choices?: string[]; // for "choice"
	default?: string | number | boolean;
	required?: boolean;
	// how it reaches the task: a word in order (positional), or --<option> [value]
	positional?: boolean;
	option?: string;
	many?: boolean; // several words: years, terms
}
