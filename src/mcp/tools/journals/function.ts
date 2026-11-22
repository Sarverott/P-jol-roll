import * as library from "../../../core/reading/library.js";
import { answer, ready } from "../shared.js";

export default async () => {
	await ready();
	return answer(library.journals());
};
