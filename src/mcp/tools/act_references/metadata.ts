import { z } from "zod";
import { eli, readOnly } from "../shared.js";

export default {
	title: "Ties of an act",
	description:
		"Ties to other acts named in details: legal basis, amendments, repeals, executive acts. as=mermaid gives them as a mermaid flowchart, the same drawing as the api and the viewer.",
	inputSchema: z.object({
		eli,
		as: z.enum(["list", "mermaid"]).default("list"),
	}),
	annotations: readOnly,
};
