// one visit of one page, a line of dataset/checkups/{publisher}/{year}.jsonl
export default interface Checkup {
	ELI: string;
	frontend: string;
	url: string;
	loadedUrl?: string;
	status?: number;
	title?: string;
	error?: string;
	checkedAt: string;
}
