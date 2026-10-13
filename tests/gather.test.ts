import { existsSync, readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

// whole run of gathering against a small copy of API that lives only in this test
test("gathers lists, listings and missing files of acts", async () => {
	const asked: string[] = [];
	const act = (pos: number, textPDF: boolean, textHTML: boolean) => ({
		ELI: `DU/2026/${pos}`,
		address: `WDU2026000000${pos}`,
		publisher: "DU",
		year: 2026,
		pos,
		title: `act ${pos}`,
		textPDF,
		textHTML,
	});
	const acts = [act(3, true, false), act(1, true, true), act(2, false, false)];

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
				{
					code: "DU",
					name: "Dziennik Ustaw",
					actsCount: 3,
					years: [2025, 2026],
				},
				{ code: "MP", name: "Monitor Polski", actsCount: 0, years: [2026] },
			],
			"/acts/DU/2026": { count: 3, totalCount: 3, items: acts },
			"/acts/MP/2026": { count: 0, totalCount: 0, items: [] },
		};
		if (path.endsWith("/text.pdf")) {
			response.setHeader("content-type", "application/pdf");
			response.end("%PDF-1.7 law");
		} else if (path.endsWith("/text.html")) {
			response.setHeader("content-type", "text/html;charset=utf-8");
			response.end("<p>law</p>");
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

	const store = await import("../src/store.js");
	const { gather } = await import("../src/gather.js");

	// details of the first act are already here
	await store.saveJson(store.partPath(acts[1], "details"), {});

	await gather({
		publishers: [],
		years: [],
		all: false,
		parts: ["details", "references", "pdf", "html"],
		limit: 2,
		rate: 6000,
	});
	server.close();

	const read = (path: string) => readFileSync(path, "utf8");
	expect(JSON.parse(read(store.listPath("statuses")))).toHaveLength(2);
	expect(JSON.parse(read(store.listPath("publishers")))).toHaveLength(2);

	// listing is kept in order of positions
	const listed = read(store.listingPath("DU", 2026)).trim().split("\n");
	expect(listed.map((line) => JSON.parse(line).pos)).toEqual([1, 2, 3]);

	// only the newest year, only what was missing, only two acts
	expect(asked.sort()).toEqual([
		"/",
		"/acts",
		"/acts/DU/2026",
		"/acts/DU/2026/1/references",
		"/acts/DU/2026/1/text.html",
		"/acts/DU/2026/1/text.pdf",
		"/acts/DU/2026/2",
		"/acts/DU/2026/2/references",
		"/acts/MP/2026",
		"/statuses",
	]);
	expect(read(store.partPath(acts[1], "pdf"))).toBe("%PDF-1.7 law");
	expect(read(store.partPath(acts[1], "html"))).toBe("<p>law</p>");
	expect(existsSync(store.partPath(acts[0], "details"))).toBe(false);
}, 60_000);
