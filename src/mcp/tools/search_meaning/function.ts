import type { z } from "zod";
import { nearest } from "../../../core/reading/embeddings.js";
import * as library from "../../../core/reading/library.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

// the nearest acts with their titles; said plainly when this host cannot search by meaning
export default async ({
	question,
	journal,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	const found = await nearest(question, { journal, limit });
	if (!found)
		return {
			content: [
				{
					type: "text" as const,
					text: "no search by meaning here: it needs the vectors of task embed and Ollama with their model; search_acts finds acts by the words of their titles",
				},
			],
			isError: true,
		};
	return answer(
		found.map(({ ELI, score }) => {
			const act = library.find(ELI);
			return {
				ELI,
				score,
				title: act?.title,
				type: act?.type,
				status: act?.status,
			};
		}),
	);
};
