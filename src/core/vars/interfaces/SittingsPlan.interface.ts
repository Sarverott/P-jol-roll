export default interface SittingsPlan {
	terms: number[]; // empty means the current one
	files: boolean; // the text of every statement into the bucket
	limit: number; // days, and then texts, one run may take; 0 means no limit
	rate: number;
	today?: Date; // days after it are not asked for (tests set it)
}
