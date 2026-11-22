import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TurndownService from "turndown";
import { filesOf } from "../apihandlers/eli.js";
import log from "../logging/setup.js";
import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";
import type { GatheringScope as GatheringTypes } from "../vars/types/index.js";
import {
	hasControl,
	isScan,
	pdfToMarkdown,
	pdftotextHere,
	printable,
	producerOf,
	textLayer,
} from "./pdf.js";

// a markdown written before control characters were dropped is read once: clean, its record
// is marked and kept; holding any, it is made again (pdf.ts, phase 18)
const kept = (record: GatheringScope.TextRecord, file: string) =>
	record.printable || !hasControl(readFileSync(file, "utf8"));

/*
Html texts of bucket -> markdown files of dataset, for people and for models;
PDFs of acts without html too, when asked (pdf.ts).
Every markdown file has a record that ties it to what it was made from, so a
reader can go back to the source and check that nothing was changed on the way.
*/

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

export const markdownPath = (act: GatheringTypes.ActAddress) =>
	`texts/${store.bucketPath(act, ".md")}`;

export const textsTablePath = (publisher: string, year: number) =>
	join(store.DATASET_DIR, "texts", publisher, `${year}.jsonl`);

export const scansTablePath = (publisher: string, year: number) =>
	join(store.DATASET_DIR, "texts", publisher, `${year}.scans.jsonl`);

/*
{pdf}: acts without HTML get markdown from the text layer of their PDF too (phase 12),
{parallel} PDFs at a time; PDFs without a layer go to the list of scans. Without it the
texts made from PDFs before are kept as they are, so "task text" never loses them.
*/
export async function text({ pdf = false, parallel = 4 } = {}) {
	if (pdf) await pdftotextHere();
	const sum = { parsed: 0, unchanged: 0, fromPdf: 0, scans: 0, unreadable: 0 };
	for (const { publisher, year } of store.listedYears()) {
		const known = new Map(
			store
				.readJsonl<GatheringScope.TextRecord>(textsTablePath(publisher, year))
				.map((record) => [record.ELI, record]),
		);
		const knownScans = new Map(
			store
				.readJsonl<GatheringScope.ScanRecord>(scansTablePath(publisher, year))
				.map((record) => [record.ELI, record]),
		);
		const acts = store.readJsonl<GatheringScope.Act>(
			store.listingPath(publisher, year),
		);
		// one place per act, filled in any order, read in the order of the listing
		const records: (GatheringScope.TextRecord | undefined)[] = [];
		const scans: (GatheringScope.ScanRecord | undefined)[] = [];
		const jobs: (() => Promise<void>)[] = [];

		acts.forEach((act, at) => {
			const markdown = markdownPath(act);
			const file = join(store.DATASET_DIR, markdown);
			const before = known.get(act.ELI);
			const source = store.actPath(act, ".html");
			if (existsSync(source)) {
				const html = readFileSync(source);
				const sha256_html = store.sha256(html);
				// the same html gives the same markdown, no need to parse it twice
				if (
					before?.sha256_html === sha256_html &&
					existsSync(file) &&
					kept(before, file)
				) {
					records[at] = { ...before, printable: true };
					sum.unchanged += 1;
					return;
				}
				jobs.push(async () => {
					const { sha256: sha256_md } = await store.writeWhole(
						file,
						printable(toMarkdown(html.toString("utf8"))),
					);
					const [{ url }] = filesOf({ ...act, textHTML: true }, "html");
					records[at] = {
						ELI: act.ELI,
						markdown,
						sha256_md,
						sha256_html,
						url,
						printable: true,
					};
					sum.parsed += 1;
				});
				return;
			}
			const scan = knownScans.get(act.ELI);
			if (!pdf) {
				if (before?.from === "pdf" && existsSync(file)) {
					// not made again without --pdf, so marked only when it is clean
					records[at] = kept(before, file)
						? { ...before, printable: true }
						: before;
					sum.unchanged += 1;
				} else if (scan) scans[at] = scan;
				return;
			}
			const path = store.actPath(act, ".pdf");
			if (!existsSync(path)) return;
			jobs.push(async () => {
				const sha256_pdf = store.sha256(readFileSync(path));
				if (
					before?.sha256_pdf === sha256_pdf &&
					existsSync(file) &&
					kept(before, file)
				) {
					records[at] = { ...before, printable: true };
					sum.unchanged += 1;
					return;
				}
				if (scan?.sha256_pdf === sha256_pdf) {
					scans[at] = scan;
					sum.scans += 1;
					return;
				}
				const [{ url }] = filesOf({ ...act, textPDF: true }, "pdf");
				const producer = await producerOf(path);
				// a damaged PDF (DU/1932/38 ends in zeros) stops nothing: what poppler still
				// read is kept, or the PDF is named in the list with the error
				const { text: layer, error } = await textLayer(path);
				if (isScan(layer)) {
					scans[at] = {
						ELI: act.ELI,
						sha256_pdf,
						...(producer ? { producer } : {}),
						url,
						...(error ? { error } : {}),
					};
					sum.scans += 1;
					if (error) {
						sum.unreadable += 1;
						log.warning(`${act.ELI}: the PDF cannot be read - ${error}`, {
							eli: act.ELI,
							error,
						});
					}
					return;
				}
				const { sha256: sha256_md } = await store.writeWhole(
					file,
					pdfToMarkdown(layer),
				);
				records[at] = {
					ELI: act.ELI,
					markdown,
					sha256_md,
					from: "pdf",
					sha256_pdf,
					producer,
					url,
					printable: true,
				};
				sum.parsed += 1;
				sum.fromPdf += 1;
			});
		});

		let next = 0;
		await Promise.all(
			Array.from({ length: Math.max(1, parallel) }, async () => {
				while (next < jobs.length) await jobs[next++]();
			}),
		);

		const texts = records.filter((record) => record !== undefined);
		const scanned = scans.filter((record) => record !== undefined);
		if (texts.length) {
			await store.saveJsonl(textsTablePath(publisher, year), texts);
			log.info(`${publisher}/${year}: ${texts.length} texts`, {
				publisher,
				year,
				texts: texts.length,
				scans: scanned.length,
			});
		}
		if (scanned.length || knownScans.size)
			await store.saveJsonl(scansTablePath(publisher, year), scanned);
	}
	return sum;
}
