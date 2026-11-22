import type { z } from "zod";
import * as library from "../../../core/reading/library.js";
import { answer, ready } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	journal,
	year,
	query,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	await ready(`${journal}/${year}`);
	const page = library.acts(journal, year, { query, offset, limit });
	return answer({
		...page,
		items: page.items.map(({ ELI, title, type, status, textHTML }) => ({
			ELI,
			title,
			type,
			status,
			textHTML,
		})),
	});
};
