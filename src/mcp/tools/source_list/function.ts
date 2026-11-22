import type { z } from "zod";
import * as dataset from "../../../core/reading/dataset.js";
import { answer, notHere } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({ name }: z.infer<typeof metadata.inputSchema>) => {
	if (!name) return answer(dataset.lists());
	await dataset.prepareDataset("lists", name);
	const found = dataset.list(name);
	return found === undefined ? notHere(`the list ${name}`) : answer(found);
};
