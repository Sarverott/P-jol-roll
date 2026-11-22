import { z } from "zod";
import { eli, readOnly } from "../shared.js";

export default {
	title: "Text of an act",
	description:
		"Markdown text of an act, in pieces: long acts are read by moving start. Made from the HTML of the act, or from the text layer of its PDF where it has no HTML - then the first line says so, as text recognised from old scans has mistakes.",
	inputSchema: z.object({
		eli,
		start: z.number().int().min(0).default(0),
		length: z.number().int().min(1000).max(50000).default(20000),
	}),
	annotations: readOnly,
};
