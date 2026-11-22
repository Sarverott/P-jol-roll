// a rule of docs/almanac/rulesets/*.json (as in BOS): the first that applies decides
export default interface Rule {
	id: string;
	statement: string;
	when: {
		action?: string | string[]; // "push", "prune", "gather"
		target?: string | string[]; // globs: "dataset", "dev/*"
		actor?: string | string[]; // "agent", "owner"
		flags?: string[]; // any of them present
	};
	verdict: "allowed" | "ask" | "violation";
	source: string; // where the rule is written
}
