import { z } from "zod";
import { eli, readOnly } from "../shared.js";

export default {
	title: "Act",
	description:
		"One act: its listing line, details from the source (status, dates, keywords, authority) and which files are gathered.",
	inputSchema: z.object({ eli }),
	annotations: readOnly,
};
