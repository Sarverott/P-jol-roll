import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "Local and regional law",
	description:
		'The official journals of the voivodeships (phase 43): resolutions of communes, districts and regions, orders of voivodes. code="POL_WOJ_LB" and year=2026 give that journal\'s acts of the year, searched by words (query); no code gives every journal - whether it answers, its code, its years, and why not when it does not.',
	inputSchema: z.object({
		code: z.string().default(""),
		year: z.number().int().default(0),
		query: z.string().default(""),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
