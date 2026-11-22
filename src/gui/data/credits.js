import { parse } from "yaml";
import authorsText from "../../../.github/AUTHORS?raw";
import linksText from "../../../webpage/src/data/links.yaml?raw";

/*
What "Terms of use" shows (layout/modals/termsdialog.vue): the members of the project as
.github/AUTHORS lists them, and the links of the project as the introduction lists them
(webpage/src/data/links.yaml) - one source each, read at build.
*/

// the website of the project, where the introduction's own links (./docs/) lead
const WEBSITE = "https://sarverott.github.io/P-jol-roll/";

// a line of AUTHORS: name, "lineage", <mail>, (address), separated by tabs
export const authors = authorsText
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith("#"))
	.map((line) => {
		const [name, ...rest] = line.split("\t");
		const lineage = rest.find((part) => part.startsWith('"'))?.slice(1, -1);
		const url = rest.find((part) => part.startsWith("("))?.slice(1, -1);
		return { name: name.replace(/-/g, " "), lineage, url };
	});

export const links = parse(linksText).map((link) => ({
	...link,
	href: /^https?:/.test(link.href)
		? link.href
		: new URL(link.href, WEBSITE).href,
}));
