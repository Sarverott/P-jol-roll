// one act of the law of the European Union (phase 42): a line of dataset/EU/acts/<year>.jsonl,
// from the Publications Office's SPARQL endpoint (CELLAR)
export default interface EuAct {
	CELEX: string; // "32016R0679"
	date: string; // of the document
	type: string; // REG, DIR, DEC, REG_IMPL, ... (the Office's resource types)
	inForce: boolean | null; // null when the Office says nothing
	title: string; // in Polish, when there is a Polish version
	ELI: string; // its ELI on eur-lex, "" when it has none
}
