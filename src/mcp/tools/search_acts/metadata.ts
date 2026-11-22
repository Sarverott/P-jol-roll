import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "Search acts of a year",
	description:
		"Acts of one year of one journal whose title has every word of the query (Polish, case does not matter). Empty query lists the year.",
	inputSchema: z.object({
		journal: z.string().describe('"DU" or "MP"'),
		year: z.number().int(),
		query: z.string().default(""),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
