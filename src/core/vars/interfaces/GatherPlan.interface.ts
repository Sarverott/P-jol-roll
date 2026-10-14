import type { GatheringScope as Types } from "../types/index.js";

export default interface GatherPlan {
	publishers: string[]; // empty means every journal
	years: number[]; // empty means only the newest one
	all: boolean; // every year of journal
	parts: Types.Part[]; // files to take for each act, empty means only lists and listings
	limit: number; // how many acts one run may take files for, 0 means no limit
	rate: number; // requests per minute
	since?: string; // only acts changed since this date, or "last" for date of previous such run
}
