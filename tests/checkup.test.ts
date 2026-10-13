import { expect, test } from "vitest";
import { frontendUrl } from "../src/checkup.js";

const act = {
	ELI: "MP/2026/7",
	address: "WMP20260000007",
	publisher: "MP",
	year: 2026,
	pos: 7,
	title: "",
	textPDF: true,
	textHTML: false,
};

test("address of website is filled with fields of act", () => {
	const url = "https://eli.gov.pl/eli/{ELI}/ogl";
	expect(frontendUrl({ title: "", url }, act)).toBe(
		"https://eli.gov.pl/eli/MP/2026/7/ogl",
	);
});

test("website can have other address for every journal", () => {
	const url = { DU: "https://du/{year}/{pos}", MP: "https://mp/{year}/{pos}" };
	expect(frontendUrl({ title: "", url }, act)).toBe("https://mp/2026/7");
	expect(frontendUrl({ title: "", url: { DU: "https://du" } }, act)).toBe(
		undefined,
	);
});
