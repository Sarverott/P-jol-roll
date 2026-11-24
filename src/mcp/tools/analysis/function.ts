import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	eli,
	kind,
	query,
	offset,
	limit,
}: z.infer<typeof metadata.inputSchema>) => {
	await dataset.prepareDataset("analysis");
	const summary = dataset.analysis();
	if (!summary)
		return answer({
			error: "the code of law is not analysed here (task analyse)",
		});
	if (eli) return answer(dataset.findings(eli));
	return answer({
		summary,
		page: dataset.findingsOf(kind, { query, offset, limit }),
	});
};
