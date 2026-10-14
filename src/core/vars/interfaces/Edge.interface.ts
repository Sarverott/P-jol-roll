// one tie between two acts, a line of dataset/references/{journal}/{year}.jsonl
export default interface Edge {
	from: string; // ELI of act whose details name the tie
	type: string; // kind from lists/reference_types.json, "Podstawa prawna"
	to: string; // ELI of the other act
	[field: string]: unknown; // what else API says about the tie: date, art
}
