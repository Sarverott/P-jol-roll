import { expect, test } from "vitest";
import {
	hasPart,
	partUrl,
	pickLists,
	pickPublishers,
	pickYears,
} from "../src/eli.js";
import { listingPath, partPath } from "../src/store.js";

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

test("every journal when none is asked", () => {
	const journals = [
		{ code: "DU", name: "", actsCount: 1, years: [] },
		{ code: "MP", name: "", actsCount: 1, years: [] },
	];
	expect(pickPublishers(journals, [])).toEqual(journals);
	expect(pickPublishers(journals, ["MP"]).map(({ code }) => code)).toEqual([
		"MP",
	]);
});

test("lists are these addresses of index that need nothing to be filled in", () => {
	const lists = pickLists({
		list_statuses: "https://api/statuses",
		list_years: "https://api/acts/{publisher}",
		act_pdf: "https://api/acts/{publisher}/{year}/{position}/text.pdf",
		search: "https://api/acts/search",
	});
	expect(lists).toEqual([{ name: "statuses", url: "https://api/statuses" }]);
});

test("addresses of act", () => {
	const act = { ELI: "DU/2026/1" };
	expect(partUrl(act, "details")).toBe(
		"https://api.sejm.gov.pl/eli/acts/DU/2026/1",
	);
	expect(partUrl(act, "pdf")).toBe(
		"https://api.sejm.gov.pl/eli/acts/DU/2026/1/text.pdf",
	);
	const stored = { publisher: "DU", year: 2026, address: "WDU20260000001" };
	expect(partPath(stored, "pdf")).toBe(
		"resources/bucket/DU/2026/WDU20260000001.pdf",
	);
	expect(partPath(stored, "references")).toBe(
		"resources/bucket/DU/2026/WDU20260000001.references.json",
	);
	expect(listingPath("DU", 2026)).toBe("resources/dataset/acts/DU/2026.jsonl");
});

test("texts are asked for only when listing says they exist", () => {
	const act = { textPDF: true, textHTML: false };
	expect(hasPart(act, "pdf")).toBe(true);
	expect(hasPart(act, "html")).toBe(false);
	expect(hasPart(act, "details")).toBe(true);
});
