import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "The law of the European Union",
	description:
		'The law of the EU, binding Poland (phase 42): celex="32016R0679" gives one act - its kind, date, whether in force, Polish title, ELI and its Polish text as markdown when it is gathered; year=2016 gives that year\'s acts, searched by words of their titles (query), only those in force (inForce); neither gives the years gathered. Kinds: REG regulation, DIR directive, DEC decision, REG_IMPL implementing regulation, ...',
	inputSchema: z.object({
		celex: z.string().default(""),
		year: z.number().int().default(0),
		query: z.string().default(""),
		inForce: z.boolean().default(false),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
		length: z.number().int().min(1000).max(50000).default(20000),
	}),
	annotations: readOnly,
};
