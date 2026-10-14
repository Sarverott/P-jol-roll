import { expect, test } from "vitest";
import {
	filesOf,
	pickLists,
	pickPublishers,
	pickYears,
} from "../src/core/apihandlers/eli.js";
import {
	actPath,
	bucketPath,
	listingPath,
} from "../src/core/resources/store.js";

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
	const act = { ELI: "DU/2026/1", textPDF: true, textHTML: false };
	const api = "https://api.sejm.gov.pl/eli/acts/DU/2026/1";
	expect(filesOf(act, "details")).toEqual([
		{ part: "details", url: api, suffix: ".json" },
	]);
	expect(filesOf(act, "pdf")[0].url).toBe(`${api}/text.pdf`);

	const stored = { publisher: "DU", year: 2026, address: "WDU20260000001" };
	expect(actPath(stored, ".pdf")).toBe(
		"resources/bucket/DU/2026/WDU20260000001.pdf",
	);
	expect(bucketPath(stored, ".references.json")).toBe(
		"DU/2026/WDU20260000001.references.json",
	);
	expect(listingPath("DU", 2026)).toBe("resources/dataset/acts/DU/2026.jsonl");
});

test("texts and structure are asked for only when listing says they exist", () => {
	const act = { ELI: "DU/2026/1", textPDF: true, textHTML: false };
	expect(filesOf(act, "pdf")).toHaveLength(1);
	expect(filesOf(act, "html")).toEqual([]);
	expect(filesOf(act, "struct")).toEqual([]);
	expect(filesOf({ ...act, textHTML: true }, "struct")[0].suffix).toBe(
		".struct.json",
	);
});

test("other texts are these of details that are not the published one", () => {
	const act = { ELI: "DU/2026/1", textPDF: true, textHTML: true };
	const texts = [
		{ fileName: "text.html", type: "H" },
		{ fileName: "D20260001.pdf", type: "O" },
		{ fileName: "D20260001.pdf", type: "I" },
		{ fileName: "D20260001L.pdf", type: "T" },
		{ fileName: "D20260001Lj.pdf", type: "U" },
		{ fileName: "../../outside.pdf", type: "U" },
	];
	expect(filesOf(act, "texts")).toEqual([]);
	expect(filesOf(act, "texts", texts)).toEqual([
		{
			part: "texts",
			url: "https://api.sejm.gov.pl/eli/acts/DU/2026/1/text/T/D20260001L.pdf",
			suffix: ".T.pdf",
		},
		{
			part: "texts",
			url: "https://api.sejm.gov.pl/eli/acts/DU/2026/1/text/U/D20260001Lj.pdf",
			suffix: ".U.pdf",
		},
	]);
});
