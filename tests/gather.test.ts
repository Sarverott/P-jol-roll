import { existsSync, readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

// small copy of API that lives only in this file
const asked: string[] = [];
const act = (pos: number, textPDF: boolean, textHTML: boolean) => ({
	ELI: `DU/2026/${pos}`,
	address: `WDU2026000000${pos}`,
	publisher: "DU",
	year: 2026,
	pos,
	title: `act ${pos}`,
	changeDate: `2026-10-0${pos}T10:00:00`,
	textPDF,
	textHTML,
});
const acts = [act(3, true, false), act(1, true, true), act(2, false, false)];
let status = "obowiązujący";

const server = createServer((request, response) => {
	const base = `http://${request.headers.host}`;
	const path = request.url ?? "";
	asked.push(path);
	const answers: Record<string, unknown> = {
		"/": {
			list_statuses: `${base}/statuses`,
			list_publishers: `${base}/acts`,
			list_years: `${base}/acts/{publisher}`,
		},
		"/statuses": ["obowiązujący", "uchylony"],
		"/acts": [
			{ code: "DU", name: "Dziennik Ustaw", actsCount: 3, years: [2025, 2026] },
			{ code: "MP", name: "Monitor Polski", actsCount: 0, years: [2026] },
		],
		"/acts/DU/2026": { count: 3, totalCount: 3, items: acts },
		"/acts/MP/2026": { count: 0, totalCount: 0, items: [] },
		"/acts/DU/2026/1": {
			...acts[1],
			status,
			texts: [
				{ fileName: "D1.pdf", type: "O" },
				{ fileName: "D1Lj.pdf", type: "U" },
			],
			references: { "Podstawa prawna": [{ id: "DU/1997/483", art: "art. 5" }] },
		},
		"/acts/DU/2026/1/struct": [{ id: "part_1", children: [] }],
		"/changes/acts?since=2026-10-01&limit=500&offset=0": {
			count: 1,
			totalCount: 1,
			offset: 0,
			items: [{ ...acts[1], changeDate: "2026-10-09T08:00:00" }],
		},
	};
	if (path.endsWith(".pdf")) {
		response.setHeader("content-type", "application/pdf");
		response.end(`%PDF-1.7 ${path}`);
	} else if (path.endsWith("/text.html")) {
		response.setHeader("content-type", "text/html;charset=utf-8");
		response.end("<h1>Ustawa</h1><script>x()</script><p>law&nbsp;of land</p>");
	} else if (path.endsWith("/2/references")) {
		// what Sejm does when it has nothing: 404 and no body
		response.statusCode = 404;
		response.end();
	} else {
		response.setHeader("content-type", "application/json");
		response.end(JSON.stringify(answers[path] ?? { path }));
	}
}).listen(0);

const work = await mkdtemp(join(tmpdir(), "pjolroll-gather-"));
process.env.ELI_API = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
process.env.RESOURCES_DIR = join(work, "resources");
process.env.CRAWLEE_STORAGE_DIR = join(work, "storage");
process.env.CRAWLEE_LOG_LEVEL = "OFF";

const store = await import("../src/core/resources/store.js");
const { gather } = await import("../src/core/methods/gather.js");
const read = (path: string) => readFileSync(path, "utf8");
const plan = {
	publishers: [],
	years: [],
	all: false,
	parts: [],
	limit: 2,
	rate: 6000,
};

test("gathers lists, listings and missing files of acts", async () => {
	// details of the second act are already here
	await store.saveJson(store.actPath(acts[2], ".json"), {});

	await gather({ ...plan, parts: ["details", "references", "pdf", "html"] });

	expect(JSON.parse(read(store.listPath("statuses")))).toHaveLength(2);
	expect(JSON.parse(read(store.listPath("publishers")))).toHaveLength(2);

	// listing is kept in order of positions
	const listed = store.readJsonl<{ pos: number }>(
		store.listingPath("DU", 2026),
	);
	expect(listed.map(({ pos }) => pos)).toEqual([1, 2, 3]);

	// only the newest year, only what was missing, only two acts
	expect(asked.sort()).toEqual([
		"/",
		"/acts",
		"/acts/DU/2026",
		"/acts/DU/2026/1",
		"/acts/DU/2026/1/references",
		"/acts/DU/2026/1/text.html",
		"/acts/DU/2026/1/text.pdf",
		"/acts/DU/2026/2/references",
		"/acts/MP/2026",
		"/statuses",
	]);
	expect(read(store.actPath(acts[1], ".pdf"))).toContain("%PDF-1.7");
	expect(existsSync(store.actPath(acts[0], ".json"))).toBe(false);

	// what source does not have is not written and is not an error
	expect(existsSync(store.actPath(acts[2], ".references.json"))).toBe(false);

	// every file that landed has a record with its checksum and its source
	const records = store.sealed("DU", 2026);
	expect([...records.keys()].sort()).toEqual([
		"DU/2026/WDU20260000001.html",
		"DU/2026/WDU20260000001.json",
		"DU/2026/WDU20260000001.pdf",
		"DU/2026/WDU20260000001.references.json",
	]);
	const pdf = records.get("DU/2026/WDU20260000001.pdf");
	expect(pdf?.sha256).toBe(store.sha256(read(store.actPath(acts[1], ".pdf"))));
	expect(pdf?.url).toBe(`${process.env.ELI_API}/acts/DU/2026/1/text.pdf`);

	// queue of requests is not kept on disk
	expect(existsSync(join(work, "storage"))).toBe(false);
}, 60_000);

test("structure, and other texts that details name", async () => {
	asked.length = 0;
	await gather({ ...plan, parts: ["struct", "texts"], limit: 1 });

	expect(asked.filter((path) => path.includes("/1/")).sort()).toEqual([
		"/acts/DU/2026/1/struct",
		"/acts/DU/2026/1/text/U/D1Lj.pdf",
	]);
	expect(read(store.actPath(acts[1], ".U.pdf"))).toContain("D1Lj.pdf");
	expect(JSON.parse(read(store.actPath(acts[1], ".struct.json")))).toHaveLength(
		1,
	);
}, 60_000);

test("file with a record is not asked for, even when it is not here", async () => {
	asked.length = 0;
	const { rm } = await import("node:fs/promises");
	await rm(store.actPath(acts[1], ".pdf"));
	await gather({ ...plan, parts: ["pdf"], limit: 0 });

	expect(asked).not.toContain("/acts/DU/2026/1/text.pdf");
	expect(asked).toContain("/acts/DU/2026/3/text.pdf");
}, 60_000);

test("acts changed since a day are taken again", async () => {
	asked.length = 0;
	status = "uchylony";
	const before = store.sealed("DU", 2026).size;
	await gather({ ...plan, since: "2026-10-01" });

	// one year listed again, details and references of the one changed act
	expect(asked.sort()).toEqual([
		"/",
		"/acts",
		"/acts/DU/2026",
		"/acts/DU/2026/1",
		"/acts/DU/2026/1/references",
		"/changes/acts?since=2026-10-01&limit=500&offset=0",
		"/statuses",
	]);
	expect(JSON.parse(read(store.actPath(acts[1], ".json"))).status).toBe(
		"uchylony",
	);

	// new record only for the file whose content changed
	expect(store.sealed("DU", 2026).size).toBe(before);
	const lines = store.readJsonl<{ path: string }>(
		store.manifestPath("DU", 2026),
	);
	expect(lines.filter(({ path }) => path.endsWith("1.json"))).toHaveLength(2);
	expect(
		lines.filter(({ path }) => path.endsWith(".references.json")),
	).toHaveLength(1);

	// the next run can continue from the newest change that was seen
	expect(JSON.parse(read(store.changesPath()))).toEqual({
		since: "2026-10-09T08:00:00",
	});
}, 60_000);

test("tables, markdown and checksums are made from what was gathered", async () => {
	server.close();
	const { compile, detailsTablePath, edgesTablePath } = await import(
		"../src/core/methods/compile.js"
	);
	const { text, textsTablePath } = await import("../src/core/parsing/text.js");
	const { seal, check } = await import("../src/core/methods/seal.js");

	expect(await compile()).toMatchObject({ details: 2, edges: 1 });
	expect(store.readJsonl(detailsTablePath("DU", 2026))).toHaveLength(2);
	expect(store.readJsonl(edgesTablePath("DU", 2026))).toEqual([
		{
			from: "DU/2026/1",
			type: "Podstawa prawna",
			to: "DU/1997/483",
			art: "art. 5",
		},
	]);

	expect(await text()).toEqual({ parsed: 1, unchanged: 0 });
	expect(await text()).toEqual({ parsed: 0, unchanged: 1 });
	const [record] = store.readJsonl<Record<string, string>>(
		textsTablePath("DU", 2026),
	);
	const markdown = read(join(store.DATASET_DIR, record.markdown));
	expect(markdown).toBe("# Ustawa\n\nlaw of land\n");
	expect(record).toEqual({
		ELI: "DU/2026/1",
		markdown: "texts/DU/2026/WDU20260000001.md",
		sha256_md: store.sha256(markdown),
		sha256_html: store.sha256(read(store.actPath(acts[1], ".html"))),
		url: `${process.env.ELI_API}/acts/DU/2026/1/text.html`,
	});

	// the file that was here before gathering gets its record, and a spoiled file is found
	expect(await seal()).toBe(1);
	expect((await check()).differs).toEqual([]);
	await store.writeWhole(store.actPath(acts[1], ".html"), "<p>other law</p>");
	expect((await check()).differs).toEqual(["DU/2026/WDU20260000001.html"]);
});
