// one command of the gatherer as a step ran it
export default interface CommandResult {
	command: string[]; // arguments of src/core/main.ts
	seconds: number;
	output: string; // last lines it printed
}
