import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "A list of the source",
	description:
		"One list of ELI API of Sejm as gathered here: statuses, document_types, institutions, keywords, reference_types, publishers. Without a name: the names.",
	inputSchema: z.object({
		name: z
			.string()
			.regex(/^[a-z_]{1,40}$/)
			.optional(),
	}),
	annotations: readOnly,
};
