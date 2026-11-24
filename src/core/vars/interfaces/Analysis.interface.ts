// the analysis of the code of law as a whole (phase 36): dataset/analysis/summary.json
export default interface Analysis {
	made: string;
	acts: number; // acts read
	inForce: number; // of them in force, each checked
	kinds: Record<string, number>; // findings of each kind
}
