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
		// the sittings (phase 35): one past, one planned, a number 0 the source lists too
		"/sejm/term10/proceedings": [
			{
				number: 31,
				title: "31. Posiedzenie",
				dates: ["2025-03-19", "2025-03-20"],
			},
			{ number: 0, title: "planned", dates: ["2025-03-21"] },
			{ number: 60, title: "60. Posiedzenie", dates: ["2099-01-01"] },
		],
		"/sejm/term10/proceedings/31/2025-03-19/transcripts": {
			proceedingNum: 31,
			date: "2025-03-19",
			statements: [
				{ num: 0, name: "Szymon Hołownia", function: "Marszałek" },
				{
					num: 1,
					name: "Katarzyna Stachowicz",
					function: "Poseł Sprawozdawca",
					club: "KO",
				},
			],
		},
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
	} else if (path.endsWith("/2025-03-20/transcripts/pdf")) {
		response.setHeader("content-type", "application/pdf");
		response.end("%PDF the day");
	} else if (path.endsWith("/2025-03-20/transcripts")) {
		response.writeHead(404).end();
	} else if (/\/transcripts\/\d+$/.test(path)) {
		response.setHeader("content-type", "text/html; charset=utf-8");
		// a number, never the address itself, in what is answered as HTML (CodeQL)
		const num = Number(path.slice(path.lastIndexOf("/") + 1));
		response.end(`<p>Statement ${num} on druk nr 1058.</p>`);
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

test("the sittings of Sejm: days that ended, who spoke, then their texts", async () => {
	const {
		sittings,
		sittingsPath,
		dayPath,
		dayPdfPath,
		statementPath,
		missingDays,
	} = await import("../src/core/apihandlers/sittings.js");
	asked.length = 0;
	const today = new Date("2025-04-01");
	await sittings({ terms: [], files: true, limit: 0, rate: 6000, today });
	expect(asked.sort()).toEqual([
		"/sejm/term",
		"/sejm/term10/proceedings",
		"/sejm/term10/proceedings/31/2025-03-19/transcripts",
		"/sejm/term10/proceedings/31/2025-03-19/transcripts/0",
		"/sejm/term10/proceedings/31/2025-03-19/transcripts/1",
		// not 0 (no sitting), not 60 (after today); 03-20 the source does not have as JSON:
		// its transcript as one PDF instead (phase 41)
		"/sejm/term10/proceedings/31/2025-03-20/transcripts",
		"/sejm/term10/proceedings/31/2025-03-20/transcripts/pdf",
	]);
	expect(store.readJson<unknown[]>(sittingsPath(10))).toHaveLength(3);
	expect(
		store.readJson<{ statements: unknown[] }>(dayPath(10, 31, "2025-03-19"))
			?.statements,
	).toHaveLength(2);
	expect(readFileSync(statementPath(10, 31, "2025-03-19", 1), "utf8")).toBe(
		"<p>Statement 1 on druk nr 1058.</p>",
	);
	expect(readFileSync(dayPdfPath(10, 31, "2025-03-20"), "utf8")).toBe(
		"%PDF the day",
	);
	expect(missingDays(10, today)).toEqual([{ sitting: 31, date: "2025-03-20" }]);

	// what is here is not asked for again
	asked.length = 0;
	await sittings({ terms: [10], files: true, limit: 0, rate: 6000, today });
	expect(asked.filter((path) => path.includes("2025-03-19"))).toEqual([]);
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
