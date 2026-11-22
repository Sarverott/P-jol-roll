import type { z } from "zod";
import * as library from "../../../core/reading/library.js";
import { answer, notHere, ready } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({ eli, as }: z.infer<typeof metadata.inputSchema>) => {
	await ready(eli);
	if (as === "mermaid") {
		const diagram = library.diagram(eli);
		return diagram ? answer(diagram) : notHere(eli);
	}
	const ties = library.references(eli);
	return ties ? answer(ties) : notHere(eli);
};
