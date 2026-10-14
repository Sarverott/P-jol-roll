import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TurndownService from "turndown";
import { type Act, filesOf } from "./eli.js";
import * as store from "./store.js";

/*
Html texts of bucket -> markdown files of dataset, for people and for models.
Every markdown file has a record that ties it to what it was made from, so a
reader can go back to the source and check that nothing was changed on the way.
*/

// a line of dataset/texts/{journal}/{year}.jsonl
export interface TextRecord {
	ELI: string;
	markdown: string; // path inside of dataset
	sha256_md: string;
	sha256_html: string;
	url: string; // html at the source
}

const turndown = new TurndownService({
	headingStyle: "atx",
	bulletListMarker: "-",
});
// buttons and scripts of the reader that Sejm wraps around the text
turndown.remove(["script", "style", "button", "head"]);

// every unit of act has a heading there: "Art. 1." and also "a)" or "1)". Only
// articles, paragraphs and chapters stay headings, the rest opens its own line of text
const MARK = "\u0001";
turndown.addRule("units", {
	filter: ["h3", "h4", "h5", "h6"],
	replacement: (content) => {
		const name = content.replace(/\*\*/g, "").trim();
		if (!name) return "";
		return /^(Art\.|§|Rozdział|Dział|Tytuł|Księga|Oddział)/.test(name)
			? `\n\n### ${name}\n\n`
			: `\n\n${MARK}${name}\n\n`;
	},
});

export const toMarkdown = (html: string) =>
	`${turndown
		// parts of title are glued together in the source
		.turndown(html.replace(/<\/span>\s*<span/g, "</span> <span"))
		.replace(/\u00a0/g, " ")
		.replace(/[ \t]+$/gm, "")
		.replace(new RegExp(`${MARK}(.*)\\n+`, "g"), "$1 ")
		.replace(/\n{3,}/g, "\n\n")
		.trim()}\n`;

export const markdownPath = (
	act: Pick<Act, "publisher" | "year" | "address">,
) => `texts/${store.bucketPath(act, ".md")}`;

export const textsTablePath = (publisher: string, year: number) =>
	join(store.DATASET_DIR, "texts", publisher, `${year}.jsonl`);

export async function text() {
	const sum = { parsed: 0, unchanged: 0 };
	for (const { publisher, year } of store.listedYears()) {
		const known = new Map(
			store
				.readJsonl<TextRecord>(textsTablePath(publisher, year))
				.map((record) => [record.ELI, record]),
		);
		const records: TextRecord[] = [];

		for (const act of store.readJsonl<Act>(
			store.listingPath(publisher, year),
		)) {
			const source = store.actPath(act, ".html");
			if (!existsSync(source)) continue;
			const html = readFileSync(source);
			const sha256_html = store.sha256(html);
			const markdown = markdownPath(act);
			const file = join(store.DATASET_DIR, markdown);

			// the same html gives the same markdown, no need to parse it twice
			const before = known.get(act.ELI);
			if (before?.sha256_html === sha256_html && existsSync(file)) {
				records.push(before);
				sum.unchanged += 1;
				continue;
			}
			const { sha256: sha256_md } = await store.writeWhole(
				file,
				toMarkdown(html.toString("utf8")),
			);
			const [{ url }] = filesOf({ ...act, textHTML: true }, "html");
			records.push({ ELI: act.ELI, markdown, sha256_md, sha256_html, url });
			sum.parsed += 1;
		}
		if (records.length) {
			await store.saveJsonl(textsTablePath(publisher, year), records);
			console.log(`${publisher}/${year}: ${records.length} texts`);
		}
	}
	return sum;
}
