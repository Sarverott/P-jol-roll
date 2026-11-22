import type { GatheringScope, ReadingScope } from "./index.js";

// one act with everything gathered about it here
export default interface ActView {
	act: GatheringScope.Act; // line of the listing
	details?: Record<string, unknown>; // answer of /acts/{ELI}, when gathered
	files: string[]; // endings of gathered files: ".pdf", ".html", ".U.pdf"
	markdown: boolean; // text made by "task text" is here
	text?: ReadingScope.TextOrigin; // what it was made from, when its record is here
}
