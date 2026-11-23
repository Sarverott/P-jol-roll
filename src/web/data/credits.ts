import { parse } from "yaml";
import { readText } from "./files.ts";

/*
What "Terms of use" of the viewer shows (src/gui/layout/modals/termsdialog.vue), read while
the website is built and handed to the viewer as a prop: the members of the project as
.github/AUTHORS lists them, and the links of the project as the introduction lists them
(webpage/src/data/links.yaml) - one source each.
*/

// the website of the project, where the introduction's own links (./docs/) lead
const WEBSITE = "https://sarverott.github.io/P-jol-roll/";

type Link = { name: string; href: string; what: string };

// a line of AUTHORS: name, "lineage", <mail>, (address), separated by tabs
const authors = readText(".github/AUTHORS")
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith("#"))
	.map((line) => {
		const [name, ...rest] = line.split("\t");
		const lineage = rest.find((part) => part.startsWith('"'))?.slice(1, -1);
		const url = rest.find((part) => part.startsWith("("))?.slice(1, -1);
		return { name: name.replace(/-/g, " "), lineage, url };
	});

const links = (parse(readText("webpage/src/data/links.yaml")) as Link[]).map(
	(link) => ({
		...link,
		href: /^https?:/.test(link.href)
			? link.href
			: new URL(link.href, WEBSITE).href,
	}),
);

export const credits = { authors, links };
