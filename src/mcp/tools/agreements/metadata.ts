import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "International agreements binding Poland",
	description:
		'The international agreements the journals of the state published (phase 42): agreements, conventions, protocols, treaties, the documents ending them, and the government\'s statements that one is in force - each with its ELI (read it with act and act_text), type, title, date and status. Searched by words (query), by type ("Konwencja", "Umowa międzynarodowa", "Oświadczenie rządowe", ...).',
	inputSchema: z.object({
		query: z.string().default(""),
		type: z.string().default(""),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
