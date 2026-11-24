import type Statement from "./Statement.interface.js";

// what one day of a sitting said (phase 35): dataset/sejm/term{n}/transcripts/{sitting}/{date}.json
export default interface SittingDay {
	proceedingNum?: number;
	date?: string;
	statements: Statement[];
}
