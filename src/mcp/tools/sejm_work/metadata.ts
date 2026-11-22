import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "Work of Sejm",
	description:
		"Legislative processes or prints of a term of Sejm, found by words (a process names the ELI of the act it ended with). Without a term: the terms gathered here, with how many of each they have.",
	inputSchema: z.object({
		term: z.number().int().min(1).max(99).optional(),
		kind: z.enum(["processes", "prints"]).default("processes"),
		query: z.string().default("").describe("words that every line found has"),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
