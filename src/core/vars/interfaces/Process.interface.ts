export default interface Process {
	term: number;
	number: string; // number of the print that started it
	title: string;
	ELI?: string; // act that came out of it
	[field: string]: unknown;
}
