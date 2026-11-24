import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "Public tenders",
	description:
		'What the state buys (phase 43): the notices of e-Zamówienia (source "BZP", every notice of the Biuletyn Zamówień Publicznych) and of TED (source "TED", notices of the EU with a buyer in Poland) of a day, day="2026-11-20", searched by words (query: a buyer, a city, a subject, a CPV code); no day gives the days gathered.',
	inputSchema: z.object({
		source: z.enum(["BZP", "TED"]).default("BZP"),
		day: z.string().default(""),
		query: z.string().default(""),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
