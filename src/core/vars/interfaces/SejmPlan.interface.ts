export default interface SejmPlan {
	terms: number[]; // empty means the current one
	all: boolean; // every term
	files: boolean; // details of processes and attachments of prints
	limit: number; // how many files one run may take, 0 means no limit
	rate: number;
}
