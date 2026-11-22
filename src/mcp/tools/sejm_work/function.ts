import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	term,
	kind,
	query,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	if (term === undefined) return answer(dataset.terms());
	await dataset.prepareDataset("sejm", String(term), kind);
	return answer(dataset.sejmWork(term, kind, { query, offset, limit }));
};
