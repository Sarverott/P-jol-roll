import { expect, test } from "vitest";
import { pdfUrl, pickYears } from "../src/eli.js";
import { listingPath, pdfPath } from "../src/store.js";

const YEARS = [1918, 1919, 2025, 2026];

test("newest year when nothing is asked", () => {
	expect(pickYears(YEARS, [], false)).toEqual([2026]);
});

test("asked years that journal does not have are dropped", () => {
	expect(pickYears(YEARS, [2025, 1940], false)).toEqual([2025]);
});

test("all years", () => {
	expect(pickYears(YEARS, [2025], true)).toEqual(YEARS);
});

test("addresses of act", () => {
	const act = {
		ELI: "DU/2026/1",
		address: "WDU20260000001",
		publisher: "DU",
		year: 2026,
	};
	expect(pdfUrl(act)).toBe(
		"https://api.sejm.gov.pl/eli/acts/DU/2026/1/text.pdf",
	);
	expect(pdfPath(act)).toBe("resources/bucket/DU/2026/WDU20260000001.pdf");
	expect(listingPath("DU", 2026)).toBe("resources/dataset/acts/DU/2026.jsonl");
});
