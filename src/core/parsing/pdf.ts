import { execFile } from "node:child_process";
import { promisify } from "node:util";

/*
Text of a PDF, for acts that have no HTML (PP2, phase 12). The text layer is read by
pdftotext of poppler: it follows the columns of a journal's page, which a plain list of
glyphs does not. Most old PDFs are scans that Adobe's Paper Capture gave a layer of
recognised text - read as it is, with its mistakes, never corrected by guessing; the
producer of the PDF goes into the record so a reader knows which texts these are.
*/

const run = promisify(execFile);
const BIG = 64 * 1024 * 1024;

// fewer letters than this on all pages: a scan without a text layer
export const SCAN_BELOW = 40;

let checked: Promise<void> | undefined;
export function pdftotextHere() {
	checked ??= run("pdftotext", ["-v"]).then(
		() => undefined,
		() => {
			throw new Error(
				"pdftotext is missing - install poppler-utils (scripts/install.sh does)",
			);
		},
	);
	return checked;
}

export async function textLayer(path: string) {
	const { stdout } = await run("pdftotext", ["-enc", "UTF-8", path, "-"], {
		maxBuffer: BIG,
	});
	return stdout;
}

// some PDFs keep the producer as UTF-16 without its mark, so pairs of ASCII bytes come
// out as one CJK sign each ("䵩捲..." is "Micr..."); such a name is split back into bytes
export function repairedName(name: string) {
	const units = [...name].map((sign) => sign.charCodeAt(0));
	// the first byte of each pair is ASCII, the second ASCII or Latin-1 ("®"); a real
	// name in CJK could pass too, which no producer of Polish journals is
	const pairs =
		units.length >= 4 &&
		units.every(
			(unit) => unit >> 8 >= 0x20 && unit >> 8 < 0x7f && (unit & 0xff) >= 0x20,
		);
	if (!pairs) return name;
	return units
		.map((unit) => String.fromCharCode(unit >> 8, unit & 0xff))
		.join("")
		.trim();
}

export async function producerOf(path: string) {
	try {
		const { stdout } = await run("pdfinfo", ["-enc", "UTF-8", path], {
			maxBuffer: BIG,
		});
		const name = stdout.match(/^Producer:\s*(.+)$/m)?.[1].trim();
		return name ? repairedName(name) : undefined;
	} catch {
		return undefined;
	}
}

export const isScan = (text: string) =>
	text.replace(/\s/g, "").length < SCAN_BELOW;

// units that open their own heading, as in markdown made from HTML
const UNIT =
	/^(Art\.\s*\d+[a-z]*\.|§\s*\d+[a-z]*\.|(Rozdział|Dział|Tytuł|Księga|Oddział)\s+[\dIVXLC]+[a-z]*\.?)\s*/u;

export function pdfToMarkdown(text: string) {
	const paragraphs = text
		.replace(/\r/g, "")
		.replace(/ /g, " ")
		// pages end with a form feed; a page break also ends a paragraph, and so does a line
		// that opens a unit, though the recognised text often has no gap before it
		.split(/\f|\n\s*\n|\n(?=\s*(?:Art\.\s*\d|§\s*\d))/u)
		.map((block) =>
			block
				// a word cut by a hyphen at the end of a line is glued back
				.replace(/(\p{Ll})-\n(\p{Ll})/gu, "$1$2")
				.split("\n")
				.map((line) => line.replace(/[ \t]+/g, " ").trim())
				.filter(Boolean)
				.join(" "),
		)
		.filter(Boolean)
		.map((paragraph) => {
			const unit = paragraph.match(UNIT);
			if (!unit) return paragraph;
			const rest = paragraph.slice(unit[0].length);
			return rest ? `### ${unit[1]}\n\n${rest}` : `### ${unit[1]}`;
		});
	return `${paragraphs.join("\n\n")}\n`;
}
