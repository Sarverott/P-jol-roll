import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	source,
	day,
	query,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	if (!day) return answer(dataset.tenderDays(source));
	await dataset.prepareDataset("tenders", source, day);
	return answer(dataset.tenders(source, day, { query, offset, limit }));
};
