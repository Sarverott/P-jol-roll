import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

// a small year: one act with html, one with a PDF of text, one a scan without a layer
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-pdf-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.ELI_API = "http://eli.test/eli";

// a PDF of one page; every line of {lines} written in Helvetica, none for a scan
function pdfOf(lines: string[]) {
	const stream = lines.length
		? `BT /F1 12 Tf 72 720 Td 14 TL ${lines.map((line) => (line ? `(${line}) Tj T*` : "0 -30 Td")).join(" ")} ET`
		: "";
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		"<< /Producer (Test Paper Capture) >>",
	];
	let pdf = "%PDF-1.4\n";
	const offsets = objects.map((body, at) => {
		const offset = pdf.length;
		pdf += `${at + 1} 0 obj\n${body}\nendobj\n`;
		return offset;
	});
	const xref = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets)
		pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return pdf;
}

const act = (pos: number, html: boolean) => ({
	ELI: `DU/1950/${pos}`,
	address: `WDU1950000000${pos}`,
	publisher: "DU",
	year: 1950,
	pos,
	textPDF: true,
	textHTML: html,
});
const acts = [act(1, true), act(2, false), act(3, false), act(4, false)];
const put = async (path: string, content: string) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(join(resources, path), content);
};
await put(
	"dataset/acts/DU/1950.jsonl",
	acts.map((one) => `${JSON.stringify(one)}\n`).join(""),
);
await put("bucket/DU/1950/WDU19500000001.html", "<h1>Ustawa</h1>");
await put(
	"bucket/DU/1950/WDU19500000002.pdf",
	pdfOf([
		"USTAWA",
		"",
		"Art. 1. Ustawa wchodzi w zy-",
		"cie z dniem ogloszenia.",
		"",
		"Rozdzial nie jest jednostka.",
	]),
);
await put("bucket/DU/1950/WDU19500000003.pdf", pdfOf([]));
// damaged as DU/1932/38 is: a beginning, then zeros to the end
await put(
	"bucket/DU/1950/WDU19500000004.pdf",
	`%PDF-1.6\n43 0 obj\n<< /Length 39 >>\n${"\0".repeat(400)}`,
);

const { pdfToMarkdown, repairedName } = await import(
	"../src/core/parsing/pdf.js"
);
const store = await import("../src/core/resources/store.js");
const { text, textsTablePath, scansTablePath } = await import(
	"../src/core/parsing/text.js"
);

let poppler = true;
try {
	execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
} catch {
	poppler = false;
}

test("text of a PDF: lines into paragraphs, cut words glued, units as headings", () => {
	expect(
		pdfToMarkdown(
			"USTAWA\n\nArt. 1. Ustawa wchodzi w ży-\ncie z dniem\nogłoszenia.\n§ 2.\f\nRozdział 3\n\nkoniec - to nie ma-\n\n",
		),
	).toBe(
		"USTAWA\n\n### Art. 1.\n\nUstawa wchodzi w życie z dniem ogłoszenia.\n\n### § 2.\n\n### Rozdział 3\n\nkoniec - to nie ma-\n",
	);
});

test("a producer kept as UTF-16 without its mark is read back", () => {
	expect(repairedName("䵩捲潳潦璮⁗潲搠㈰ㄹ")).toBe("Microsoft® Word 2019");
	expect(repairedName("Adobe PDF Library 9.9")).toBe("Adobe PDF Library 9.9");
	expect(repairedName("Zażółć")).toBe("Zażółć");
});

test.skipIf(!poppler)(
	"acts without html get markdown from their PDF, scans are listed",
	async () => {
		expect(await text()).toEqual({
			parsed: 1,
			unchanged: 0,
			fromPdf: 0,
			scans: 0,
			unreadable: 0,
		});
		expect(await text({ pdf: true })).toEqual({
			parsed: 1,
			unchanged: 1,
			fromPdf: 1,
			scans: 2,
			unreadable: 1,
		});
		const records = store.readJsonl<Record<string, string>>(
			textsTablePath("DU", 1950),
		);
		expect(records.map((record) => record.ELI)).toEqual([
			"DU/1950/1",
			"DU/1950/2",
		]);
		const pdf = join(store.BUCKET_DIR, "DU/1950/WDU19500000002.pdf");
		const markdown = readFileSync(
			join(store.DATASET_DIR, records[1].markdown),
			"utf8",
		);
		expect(markdown).toBe(
			"USTAWA\n\n### Art. 1.\n\nUstawa wchodzi w zycie z dniem ogloszenia.\n\nRozdzial nie jest jednostka.\n",
		);
		expect(records[1]).toEqual({
			ELI: "DU/1950/2",
			markdown: "texts/DU/1950/WDU19500000002.md",
			sha256_md: store.sha256(markdown),
			from: "pdf",
			sha256_pdf: store.sha256(readFileSync(pdf)),
			producer: "Test Paper Capture",
			url: "http://eli.test/eli/acts/DU/1950/2/text.pdf",
			printable: true,
		});
		const [scan, damaged] = store.readJsonl<Record<string, string>>(
			scansTablePath("DU", 1950),
		);
		expect(scan).toMatchObject({
			ELI: "DU/1950/3",
			url: "http://eli.test/eli/acts/DU/1950/3/text.pdf",
		});
		expect(scan.error).toBeUndefined();
		expect(damaged.ELI).toBe("DU/1950/4");
		expect(damaged.error).toMatch(/Syntax Error|pdftotext|Couldn't/);
		expect(
			existsSync(join(store.DATASET_DIR, "texts/DU/1950/WDU19500000003.md")),
		).toBe(false);

		// nothing read twice; without --pdf the texts of PDFs and the scans stay
		expect(await text({ pdf: true })).toMatchObject({
			parsed: 0,
			unchanged: 2,
			scans: 2,
			unreadable: 0,
		});
		expect(await text()).toMatchObject({ parsed: 0, unchanged: 2 });
		expect(store.readJsonl(textsTablePath("DU", 1950))).toHaveLength(2);
		expect(store.readJsonl(scansTablePath("DU", 1950))).toHaveLength(2);

		// a text written before phase 18 with control characters is made again, once
		const file = join(store.DATASET_DIR, records[1].markdown);
		writeFileSync(file, `${markdown}\u0003\n`);
		const old = store.readJsonl<Record<string, unknown>>(
			textsTablePath("DU", 1950),
		);
		await store.saveJsonl(
			textsTablePath("DU", 1950),
			old.map(({ printable: _, ...record }) => record),
		);
		expect(await text({ pdf: true })).toMatchObject({
			parsed: 1,
			unchanged: 1,
		});
		expect(readFileSync(file, "utf8")).toBe(markdown);
		expect(await text({ pdf: true })).toMatchObject({
			parsed: 0,
			unchanged: 2,
		});
	},
);

test("control characters of unmapped glyphs are dropped, a page break stays one", () => {
	expect(
		pdfToMarkdown("Art. 1. Tekst\u0003\n\u0003\n\u0012 dalej\fstrona\u0085"),
	).toBe("### Art. 1.\n\nTekst dalej\n\nstrona\n");
});
