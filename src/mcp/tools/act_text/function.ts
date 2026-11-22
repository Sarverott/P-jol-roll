import type { z } from "zod";
import * as library from "../../../core/reading/library.js";
import { answer, notHere, ready } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	eli,
	start,
	length,
}: z.infer<typeof metadata.inputSchema>) => {
	await ready(eli);
	const text = library.text(eli);
	if (text === undefined) return notHere(`text of ${eli}`);
	const origin = library.textOrigin(eli);
	const note =
		start === 0 && origin?.from === "pdf"
			? `[text layer of the PDF${origin.producer ? ` (${origin.producer})` : ""}, not corrected; the source: ${origin.url}]\n\n`
			: "";
	const end = Math.min(text.length, start + length);
	const more =
		end < text.length
			? `\n\n[characters ${start}-${end} of ${text.length}, continue with start=${end}]`
			: "";
	return answer(note + text.slice(start, end) + more);
};
