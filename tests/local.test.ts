import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// local and regional law and public tenders (phase 43): stand-ins of a voivodeship's journal,
// of e-Zamówienia (whose page number is ignored) and of TED
const asked: string[] = [];
let full = 0; // BZP windows that came back full
const source = createServer((request, response) => {
	const url = new URL(request.url ?? "", "http://x");
	asked.push(`${request.method} ${url.pathname}`);
	const json = (value: unknown) => {
		response.setHeader("content-type", "application/json");
		response.end(JSON.stringify(value));
	};
	if (url.pathname === "/api/eli/acts")
		return json([{ code: "POL_WOJ_LB", years: [2025, 2026], deedsCount: 2 }]);
	if (url.pathname === "/api/eli/acts/POL_WOJ_LB/2026")
		return json({
			items: [
				{
					ELI: "POL_WOJ_LB/2026/1",
					address: "POL_WOJ_LB202601",
					publisher: "POL_WOJ_LB",
					year: 2026,
					pos: 1,
					title: "Rozporządzenie o szczepieniu kotów",
					textPDF: true,
					textHTML: true,
				},
				{
					ELI: "POL_WOJ_LB/2026/2",
					address: "../x",
					publisher: "POL_WOJ_LB",
					year: 2026,
					pos: 2,
					title: "zła nazwa",
					textPDF: true,
					textHTML: false,
				},
			],
		});
	if (url.pathname === "/api/eli/acts/POL_WOJ_LB/2026/1/text.pdf") {
		response.setHeader("content-type", "application/pdf");
		return response.end("%PDF act");
	}
	if (url.pathname === "/bzp/notice") {
		const type = url.searchParams.get("NoticeType");
		const from = url.searchParams.get("PublicationDateFrom") ?? "";
		const to = url.searchParams.get("PublicationDateTo") ?? "";
		if (type === "CompetitionNotice") {
			response.writeHead(400);
			return response.end("{}");
		}
		if (type !== "ContractNotice") return json([]);
		// the whole day is full (100), each half has 60: the gatherer must split it
		if (from.endsWith("T00:00:00") && to.endsWith("T23:59:59")) {
			full++;
			return json(
				Array.from({ length: 100 }, (_, i) => ({
					objectId: `x${i}`,
					bzpNumber: `old ${i}`,
				})),
			);
		}
		const half = from.endsWith("T00:00:00") ? "a" : "b";
		return json(
			Array.from({ length: 60 }, (_, i) => ({
				objectId: `${half}${i}`,
				bzpNumber: `2026/BZP ${half}${i}`,
				organizationName: "Gmina Lublin",
				htmlBody: `<p>notice ${half}${i}</p>`,
			})),
		);
	}
	if (url.pathname === "/ted/notices/search" && request.method === "POST") {
		let body = "";
		request.on("data", (chunk) => {
			body += chunk;
		});
		request.on("end", () => {
			const query = JSON.parse(body);
			expect(query.query).toBe(
				"buyer-country=POL AND publication-date=20261120",
			);
			json({
				totalNoticeCount: 1,
				notices: [
					{
						"publication-number": "807282-2026",
						"buyer-name": { pol: ["Szpital w Tarnowie"] },
						links: { pdf: {} },
					},
				],
			});
		});
		return;
	}
	response.writeHead(404).end();
});
await new Promise<void>((done) => source.listen(0, "127.0.0.1", done));
const host = `127.0.0.1:${(source.address() as AddressInfo).port}`;
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-local-"));
const registry = join(work, "journals.yaml");
await writeFile(
	registry,
	`journals:\n  - {voivodeship: lubelskie, host: "${host}"}\n  - {voivodeship: mazowieckie, host: "127.0.0.1:1"}\n`,
);
process.env.REGIONAL_JOURNALS = registry;
process.env.BZP_API = `http://${host}/bzp`;
process.env.TED_API = `http://${host}/ted`;
process.env.RESOURCES_DIR = join(work, "resources");
process.env.WEB_DIR = join(work, "no-web");
process.env.CRAWLEE_LOG_LEVEL = "OFF";
afterAll(() => source.close());

test("the voivodeships' journals: asked what they are, a year's acts, their PDFs", async () => {
	const { regional, journalsPath, yearPath, pdfPath } = await import(
		"../src/core/apihandlers/regional.js"
	);
	const store = await import("../src/core/resources/store.js");
	const states = await regional({
		codes: [],
		years: [],
		files: true,
		limit: 0,
		rate: 6000,
	});
	expect(states.map((one) => [one.voivodeship, one.answers, one.code])).toEqual(
		[["lubelskie", true, "POL_WOJ_LB"]],
	);
	// the journal that did not answer is kept with why
	const kept = store.readJson<
		{ voivodeship: string; answers: boolean; error?: string }[]
	>(journalsPath());
	expect(kept?.[1]).toMatchObject({
		voivodeship: "mazowieckie",
		answers: false,
	});
	expect(kept?.[1].error).toBeTruthy();
	// the newest year when none is asked for; a bad address never named a file
	expect(store.readJsonl(yearPath("POL_WOJ_LB", 2026))).toHaveLength(2);
	expect(
		readFileSync(pdfPath("POL_WOJ_LB", 2026, "POL_WOJ_LB202601"), "utf8"),
	).toBe("%PDF act");
	expect(asked.filter((one) => one.includes("text.pdf"))).toEqual([
		"GET /api/eli/acts/POL_WOJ_LB/2026/1/text.pdf",
	]);

	const dataset = await import("../src/core/reading/dataset.js");
	expect(
		dataset.regionalActs("POL_WOJ_LB", 2026, { query: "kotów" }).total,
	).toBe(1);
	expect(dataset.regionalActs("../etc", 2026).total).toBe(0);
});

test("public tenders: a full window split in two, the notices' HTML in the bucket, TED for Poland", async () => {
	const { tenders, dayPath, noticePath } = await import(
		"../src/core/apihandlers/tenders.js"
	);
	const store = await import("../src/core/resources/store.js");
	const sum = await tenders({
		days: ["2026-11-20", "2026-12-01"],
		sources: ["BZP", "TED"],
		limit: 0,
		today: new Date("2026-11-24"),
		wait: 0,
	});
	// the day after today is not taken; 100 came back for the day, so it was asked in halves
	expect(sum).toEqual({
		sum: { "BZP 2026-11-20": 120, "TED 2026-11-20": 1 },
		failed: [],
	});
	expect(full).toBe(1);
	const notices = store.readJsonl<Record<string, unknown>>(
		dayPath("BZP", "2026-11-20"),
	);
	expect(notices).toHaveLength(120);
	expect(notices[0].htmlBody).toBeUndefined(); // the HTML goes to the bucket
	expect(existsSync(noticePath("2026-11-20", "a0"))).toBe(true);
	expect(
		store.readJsonl<Record<string, unknown>>(dayPath("TED", "2026-11-20"))[0],
	).toEqual({
		"publication-number": "807282-2026",
		"buyer-name": { pol: ["Szpital w Tarnowie"] },
	});
	const dataset = await import("../src/core/reading/dataset.js");
	expect(dataset.tenderDays("BZP")).toEqual(["2026-11-20"]);
	expect(dataset.tenders("BZP", "2026-11-20", { query: "a59" }).total).toBe(1);
	const { daysOf } = await import("../src/core/apihandlers/tenders.js");
	expect(daysOf(["2026-02"])).toHaveLength(28);
});
