export default interface Print {
	term: number;
	number: string;
	title: string;
	attachments?: string[]; // names of files: draft, justification, opinions
	[field: string]: unknown;
}
