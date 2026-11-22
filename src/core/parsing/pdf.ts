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

// the text, and the first complaint of poppler when the PDF is damaged (then text is what
// it could still read, often nothing)
export async function textLayer(
	path: string,
): Promise<{ text: string; error?: string }> {
	try {
		const { stdout } = await run("pdftotext", ["-enc", "UTF-8", path, "-"], {
			maxBuffer: BIG,
		});
		return { text: stdout };
	} catch (failure) {
		const {
			stdout = "",
			stderr = "",
			message = "",
		} = failure as {
			stdout?: string;
			stderr?: string;
			message?: string;
		};
		const first = (stderr || message).split("\n").find((line) => line.trim());
		return { text: stdout, error: first?.trim() || "pdftotext failed" };
	}
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

/*
Control characters: glyphs a font of a PDF maps to nothing come out of pdftotext as bytes 1-31
(MP/2025/29 had 670 of them, 2205 texts had some). Hugging Face takes such a file as binary
and refuses the whole commit (2026-11-22, docs/almanac/cataclistics/hub-binary-text.md).
Every character of C0 and C1 but tab, new line, carriage return and form feed (a page break
here) is dropped.
*/
// biome-ignore lint/suspicious/noControlCharactersInRegex: finding them is the point
const CONTROL = /[\u0000-\u0008\u000b\u000e-\u001f\u007f-\u009f]/;
export const hasControl = (text: string) => CONTROL.test(text);
const CONTROLS = new RegExp(CONTROL.source, "gu");
// a line that held only such characters goes away whole, so it does not become a gap that
// ends a paragraph
export const printable = (text: string) =>
	hasControl(text)
		? text
				.split("\n")
				.filter(
					(line) => !hasControl(line) || line.replace(CONTROLS, "").trim(),
				)
				.join("\n")
				.replace(CONTROLS, "")
		: text;

export function pdfToMarkdown(text: string) {
	const paragraphs = printable(text)
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
