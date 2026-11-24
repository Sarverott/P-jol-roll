import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// the code of law analysed (phase 36): a handful of acts and ties made for each kind of finding,
// and for the cases that must not be found
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-analysis-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");
process.env.ANALYSE_CONSOLIDATE = "3";

const act = (
	pos: number,
	status: string,
	type: string,
	title: string,
	promulgation: string,
) => ({
	ELI: `DU/2000/${pos}`,
	address: `WDU2000000${pos}`,
	publisher: "DU",
	year: 2000,
	pos,
	title,
	type,
	status,
	promulgation,
	textPDF: false,
	textHTML: false,
});
const acts = [
	act(
		1,
		"obowiązujący",
		"Rozporządzenie",
		"Rozporządzenie o czymś",
		"2000-01-10",
	),
	act(2, "uchylony", "Ustawa", "Ustawa stara", "2000-01-01"),
	act(3, "obowiązujący", "Ustawa", "Ustawa nowa", "2000-05-01"),
	act(
		4,
		"akt posiada tekst jednolity",
		"Ustawa",
		"Ustawa często zmieniana",
		"2000-01-02",
	),
	act(
		5,
		"obowiązujący",
		"Obwieszczenie",
		"Obwieszczenie - tekst jednolity",
		"2000-03-01",
	),
	act(
		6,
		"obowiązujący",
		"Ustawa",
		"Ustawa o zmianie ustawy o czymś",
		"2000-02-01",
	),
	act(7, "obowiązujący", "Wyrok", "Wyrok Trybunału", "2000-04-01"),
	act(8, "obowiązujący", "Ustawa", "Ustawa osądzona", "2000-01-03"),
	act(
		9,
		"obowiązujący",
		"Ustawa",
		"Ustawa osądzona i poprawiona",
		"2000-01-03",
	),
];
const edges = [
	// 1 stands on 2, which 3 repealed; and refers to it twice (one finding)
	{ from: "DU/2000/1", type: "Podstawa prawna", to: "DU/2000/2" },
	{ from: "DU/2000/1", type: "Odesłania", to: "DU/2000/2" },
	{ from: "DU/2000/1", type: "Odesłania", to: "DU/2000/2" },
	{ from: "DU/2000/1", type: "Odesłania", to: "DU/2000/3" }, // in force: nothing
	{
		from: "DU/2000/2",
		type: "Akty uchylające",
		to: "DU/2000/3",
		date: "2000-05-01",
	},
	// 4: consolidated by 5 on 2000-03-01; amended once before and three times after
	{ from: "DU/2000/5", type: "Tekst jednolity dla aktu", to: "DU/2000/4" },
	...["2000-02-01", "2000-03-05", "2000-04-05", "2000-06-05"].map(
		(date, index) => ({
			from: "DU/2000/4",
			type: "Akty zmieniające",
			to: `DU/2000/${20 + index}`,
			date,
		}),
	),
	// 6 only amends: its own amendments and judgment are not findings
	...["2000-03-01", "2000-04-01", "2000-05-01"].map((date, index) => ({
		from: "DU/2000/6",
		type: "Akty zmieniające",
		to: `DU/2000/${30 + index}`,
		date,
	})),
	{ from: "DU/2000/6", type: "Orzeczenie TK", to: "DU/2000/7" },
	// 8 judged and never amended since; 9 judged and amended after
	{ from: "DU/2000/8", type: "Orzeczenie TK", to: "DU/2000/7" },
	{ from: "DU/2000/9", type: "Orzeczenie TK", to: "DU/2000/7" },
	{
		from: "DU/2000/9",
		type: "Akty zmieniające",
		to: "DU/2000/40",
		date: "2000-06-01",
	},
];
const put = async (path: string, lines: unknown[]) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(
		join(resources, path),
		lines.map((one) => `${JSON.stringify(one)}\n`).join(""),
	);
};
await put("dataset/acts/DU/2000.jsonl", acts);
await put("dataset/references/DU/2000.jsonl", edges);
await mkdir(join(resources, "dataset/lists"), { recursive: true });
await writeFile(
	join(resources, "dataset/lists/publishers.json"),
	JSON.stringify([{ code: "DU", name: "Dziennik Ustaw" }]),
);

const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => server.close());

test("every act in force against its ties: what is found, and what is not", async () => {
	const { analyseAll } = await import("../src/core/methods/analyse.js");
	const summary = await analyseAll();
	expect(summary).toMatchObject({
		acts: 9,
		inForce: 8,
		kinds: {
			"basis-repealed": 1,
			"reference-repealed": 1,
			"consolidation-due": 1,
			tribunal: 1,
		},
	});
	const dataset = await import("../src/core/reading/dataset.js");
	expect(dataset.findings("DU/2000/1")).toEqual([
		expect.objectContaining({
			kind: "basis-repealed",
			to: "DU/2000/2",
			status: "uchylony",
			successor: "DU/2000/3",
		}),
		expect.objectContaining({
			kind: "reference-repealed",
			to: "DU/2000/2",
			successor: "DU/2000/3",
		}),
	]);
	expect(dataset.findings("DU/2000/4")).toEqual([
		expect.objectContaining({
			kind: "consolidation-due",
			count: 3,
			since: "2000-03-01",
		}),
	]);
	expect(dataset.findings("DU/2000/8")).toEqual([
		expect.objectContaining({
			kind: "tribunal",
			to: "DU/2000/7",
			since: "2000-04-01",
		}),
	]);
	expect(dataset.findings("DU/2000/6")).toEqual([]); // only amends
	expect(dataset.findings("DU/2000/9")).toEqual([]); // amended after the judgment
	expect(dataset.findingsOf("tribunal").total).toBe(1);
});

test("the analysis through MCP and the api", async () => {
	const { connect } = await import("../src/mcp/client.js");
	const client = await connect(`${url}/mcp`);
	try {
		const said = (result: Awaited<ReturnType<typeof client.callTool>>) =>
			JSON.parse(
				(result.content as { text: string }[]).map((one) => one.text).join(""),
			);
		const all = said(
			await client.callTool({
				name: "analysis",
				arguments: { kind: "consolidation-due" },
			}),
		);
		expect(all.summary.inForce).toBe(8);
		expect(all.page.items.map((one: { ELI: string }) => one.ELI)).toEqual([
			"DU/2000/4",
		]);
		const one = said(
			await client.callTool({
				name: "analysis",
				arguments: { eli: "DU/2000/8" },
			}),
		);
		expect(one[0].kind).toBe("tribunal");
	} finally {
		await client.close();
	}
	expect(
		await (await fetch(`${url}/api/acts/DU/2000/1/findings`)).json(),
	).toHaveLength(2);
	const page = await (
		await fetch(`${url}/api/analysis?kind=basis-repealed`)
	).json();
	expect(page.page.total).toBe(1);
});
