import type { z } from "zod";
import * as library from "../../../core/reading/library.js";
import { answer, notHere, ready } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({ eli }: z.infer<typeof metadata.inputSchema>) => {
	await ready(eli);
	const view = library.act(eli);
	return view ? answer(view) : notHere(eli);
};
