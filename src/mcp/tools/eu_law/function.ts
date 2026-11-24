import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer, notHere } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({
	celex,
	year,
	query,
	inForce,
	offset,
	limit,
	length,
}: z.infer<typeof metadata.inputSchema>) => {
	if (celex) {
		const act = await dataset.euAct(celex, length);
		return act ? answer(act) : notHere(celex);
	}
	if (year) {
		await dataset.prepareDataset("eu", String(year));
		return answer(dataset.euActs(year, { query, offset, limit, inForce }));
	}
	return answer(dataset.euYears());
};
