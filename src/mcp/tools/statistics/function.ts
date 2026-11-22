import * as dataset from "../../../core/reading/dataset.js";
import { answer } from "../shared.js";

export default async () => {
	await dataset.prepareDataset("statistics");
	return answer(dataset.statistics());
};
