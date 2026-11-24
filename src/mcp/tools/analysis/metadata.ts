import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "The code of law analysed",
	description:
		'What the analysis of every act in force found from its ties, each with the improvement it suggests (task analyse, phase 36): basis-repealed (its legal basis was repealed), reference-repealed (it refers to a repealed act; successor: the act that repealed it), consolidation-due (amended many times since its last consolidated text), tribunal (judged by the Constitutional Tribunal, not amended since). eli="DU/1997/939": the findings of one act; else the count of each kind and a page of one kind.',
	inputSchema: z.object({
		eli: z.string().default("").describe('one act, "DU/1997/939"; "" for all'),
		kind: z
			.enum([
				"",
				"basis-repealed",
				"reference-repealed",
				"consolidation-due",
				"tribunal",
			])
			.default(""),
		query: z.string().default(""),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
