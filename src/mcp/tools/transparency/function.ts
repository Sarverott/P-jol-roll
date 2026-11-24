import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	of,
	query,
	kind,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	await dataset.prepareDataset("transparency");
	return answer(
		of === "networks"
			? dataset.networks({ query, offset, limit })
			: dataset.offices({ query, kind, offset, limit }),
	);
};
