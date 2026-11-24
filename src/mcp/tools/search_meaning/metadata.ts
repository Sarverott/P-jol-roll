import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "Search acts by meaning",
	description:
		"Acts of every year nearest in meaning to a question in any language (a vector of the question compared with the vectors of the acts' titles and beginnings). Use it first for a question in words; then read the acts found with act and act_text.",
	inputSchema: z.object({
		question: z.string().min(1),
		journal: z.string().default("").describe('"DU", "MP" or "" for both'),
		limit: z.number().int().min(1).max(50).default(10),
	}),
	annotations: readOnly,
};
