import { existsSync, readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

// small copies of two other APIs: work of Sejm and court judgments
const asked: string[] = [];
const judgments = (from: number, count: number) =>
	Array.from({ length: count }, (_, index) => ({ id: from + index }));

const server = createServer((request, response) => {
	const path = request.url ?? "";
	asked.push(path);
	const answers: Record<string, unknown> = {
		"/sejm/term": [
			{ num: 9, current: false },
			{ num: 10, current: true },
		],
		"/sejm/term10/prints": [
			{
				term: 10,
				number: "320",
				title: "draft",
				attachments: ["320.pdf", "../x"],
			},
		],
		"/sejm/term10/processes?limit=500&offset=0": [
			{ term: 10, number: "320", title: "bill", ELI: "DU/2024/862" },
		],
		"/sejm/term10/processes/320": { number: "320", stages: [] },
	};
	const page = new URL(path, "http://x").searchParams.get("pageNumber");
	if (path.startsWith("/saos/dump/judgments") && path.includes("2025-01-01")) {
		response.setHeader("content-type", "application/json;charset=UTF-8");
		response.end(
			JSON.stringify({
				items: page === "0" ? judgments(1, 100) : judgments(101, 7),
			}),
		);
	} else if (path.startsWith("/saos/")) {
		response.setHeader("content-type", "application/json;charset=UTF-8");
		response.end(JSON.stringify({ items: [] }));
	} else if (path.endsWith(".pdf")) {
		response.setHeader("content-type", "application/pdf");
		response.end("%PDF draft");
	} else {
		response.setHeader("content-type", "application/json");
		response.end(JSON.stringify(answers[path] ?? []));
	}
}).listen(0);

const work = await mkdtemp(join(tmpdir(), "pjolroll-sources-"));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
process.env.SEJM_API = `${base}/sejm`;
process.env.SAOS_API = `${base}/saos`;
process.env.RESOURCES_DIR = join(work, "resources");
process.env.CRAWLEE_LOG_LEVEL = "OFF";

const store = await import("../src/core/resources/store.js");

test("work of Sejm: tables of the current term, then files that miss", async () => {
	const { sejm, tablePath, processPath, attachmentPath } = await import(
		"../src/core/apihandlers/sejm.js"
	);
	await sejm({ terms: [], all: false, files: true, limit: 0, rate: 6000 });

	expect(asked.sort()).toEqual([
		"/sejm/term",
		"/sejm/term10/prints",
		"/sejm/term10/prints/320/320.pdf",
		"/sejm/term10/processes/320",
		"/sejm/term10/processes?limit=500&offset=0",
	]);
	expect(store.readJsonl(tablePath(10, "processes"))).toHaveLength(1);
	expect(existsSync(processPath(10, "320"))).toBe(true);
	expect(readFileSync(attachmentPath(10, "320", "320.pdf"), "utf8")).toBe(
		"%PDF draft",
	);

	// what is here is not asked for again
	asked.length = 0;
	await sejm({ terms: [10], all: false, files: true, limit: 0, rate: 6000 });
	expect(asked.filter((path) => path.includes("320"))).toEqual([]);
}, 60_000);

test("judgments: months that ended, each one whole", async () => {
	const { saos, monthPath, missingMonths } = await import(
		"../src/core/apihandlers/saos.js"
	);
	const today = new Date("2025-03-15");
	expect(missingMonths([2025], today)).toEqual([
		{ year: 2025, month: 1 },
		{ year: 2025, month: 2 },
	]);

	asked.length = 0;
	await saos({ years: [2025], limit: 0, rate: 6000, today });
	expect(asked.sort()).toEqual([
		"/saos/dump/judgments?judgmentStartDate=2025-01-01&judgmentEndDate=2025-01-31&pageSize=100&pageNumber=0",
		"/saos/dump/judgments?judgmentStartDate=2025-01-01&judgmentEndDate=2025-01-31&pageSize=100&pageNumber=1",
		"/saos/dump/judgments?judgmentStartDate=2025-02-01&judgmentEndDate=2025-02-28&pageSize=100&pageNumber=0",
	]);
	expect(store.readJsonl(monthPath(2025, 1))).toHaveLength(107);
	expect(store.readJsonl(monthPath(2025, 2))).toEqual([]);
	expect(missingMonths([2025], today)).toEqual([]);
	server.close();
}, 60_000);
