import { expect, test } from "vitest";
// @ts-expect-error: a module of the desktop app, plain JavaScript
import { ascii, label, wrap } from "../src/desktop/labels.js";

// a label of an act for a Bluetooth sticker printer (phase 40): its bytes of ESC/POS
test("an act's label: reset, the ELI in bold, the title wrapped, a QR code, a cut", () => {
	expect(ascii("Ustawa o świadczeniach – „Dz.U.” § 5")).toBe(
		'Ustawa o swiadczeniach - "Dz.U." par. 5',
	);
	expect(wrap("Prawo bankowe i zmiana niektórych ustaw", 13)).toEqual([
		"Prawo bankowe",
		"i zmiana",
		"niektórych",
		"ustaw",
	]);
	expect(wrap("abcdefghijklmnop", 6)).toEqual(["abcdef", "ghijkl", "mnop"]);

	const url = "https://example.org/#act/DU/1997/939";
	const bytes: number[] = label(
		{
			eli: "DU/1997/939",
			title: "Ustawa z dnia 29 sierpnia 1997 r. - Prawo bankowe.",
			url,
		},
		{ width: 32 },
	);
	const text = Buffer.from(bytes).toString("latin1");
	expect(bytes.slice(0, 2)).toEqual([0x1b, 0x40]); // reset
	expect(text).toContain("\x1bE\x01DU/1997/939\n\x1bE\x00");
	expect(text).toContain(
		"Ustawa z dnia 29 sierpnia 1997\nr. - Prawo bankowe.\n",
	);
	// the QR: model 2, then the data stored with its length (3 + bytes), then printed
	const stored = [0x1d, 0x28, 0x6b, url.length + 3, 0, 0x31, 0x50, 0x30];
	const at = bytes.findIndex((_, index) =>
		stored.every((one, offset) => bytes[index + offset] === one),
	);
	expect(at).toBeGreaterThan(0);
	expect(Buffer.from(bytes.slice(at + 8, at + 8 + url.length)).toString()).toBe(
		url,
	);
	expect(bytes.slice(-4)).toEqual([0x1d, 0x56, 0x42, 0]); // feed and cut
	expect(bytes.every((one) => one >= 0 && one <= 255)).toBe(true);

	// a long title: four lines at most, the last one ended with "..."
	const long: number[] = label(
		{ eli: "DU/2026/1", title: "słowo ".repeat(40) },
		{ width: 20 },
	);
	const lines = Buffer.from(long).toString("latin1").split("\n");
	expect(lines.filter((line) => line.includes("slowo")).length).toBe(4);
	expect(lines.some((line) => line.endsWith("..."))).toBe(true);
});
