import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	query,
	type,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	await dataset.prepareDataset("agreements");
	return answer(dataset.agreements({ query, type, offset, limit }));
};
