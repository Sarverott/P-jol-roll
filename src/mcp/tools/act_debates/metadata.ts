import { z } from "zod";
import { eli, readOnly } from "../shared.js";

export default {
	title: "An act in Sejm: who said what",
	description:
		"The days of the sittings of Sejm its bill was read on (the stages of its legislative process), and the statements of those days: who spoke, as whom, from which club. Where the texts of statements are gathered, only those naming one of the bill's prints are given (about: true), with their words around it; all=true gives every statement of the day. Empty days: their transcripts not gathered yet (task sittings).",
	inputSchema: z.object({
		eli,
		all: z.boolean().default(false),
	}),
	annotations: readOnly,
};
