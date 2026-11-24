import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	code,
	year,
	query,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	await dataset.prepareDataset("regional", code, String(year));
	if (!code || !year) return answer(dataset.regionalJournals());
	return answer(dataset.regionalActs(code, year, { query, offset, limit }));
};
