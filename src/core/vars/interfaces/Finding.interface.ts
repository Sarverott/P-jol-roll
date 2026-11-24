// what the analysis of the code of law found about one act in force (phase 36, task analyse)
export default interface Finding {
	ELI: string; // the act in force
	kind:
		| "basis-repealed" // its legal basis is an act repealed
		| "reference-repealed" // it refers to an act repealed
		| "consolidation-due" // amended many times since its last consolidated text
		| "tribunal"; // judged by the Constitutional Tribunal, not amended since
	title: string;
	to?: string; // the act the finding is about: the basis, the reference, the judgment
	status?: string; // that act's status
	successor?: string; // the act that repealed it, to refer to instead
	count?: number; // amendments since the last consolidated text, or since the judgment
	since?: string; // the date counted from
	proposal: string; // the improvement it suggests, in words
	[field: string]: unknown;
}
