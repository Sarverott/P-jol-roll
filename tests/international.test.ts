import { existsSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// international law (phase 42): a stand-in of the Publications Office of the EU - its SPARQL
// endpoint and the content negotiation of its texts - and the agreements of the journals
const asked: { path: string; accept: string; language: string }[] = [];
const binding = (
	celex: string,
	type: string,
	force: string | undefined,
	title: string,
) => ({
	celex: { value: celex },
	date: { value: "2016-04-27" },
	type: {
		value: `http://publications.europa.eu/resource/authority/resource-type/${type}`,
	},
	...(force === undefined ? {} : { force: { value: force } }),
	title: { value: title },
	eli: { value: `http://data.europa.eu/eli/x/${celex}` },
});
const source = createServer((request, response) => {
	const url = new URL(request.url ?? "", "http://x");
	asked.push({
		path: url.pathname,
		accept: String(request.headers.accept),
		language: String(request.headers["accept-language"] ?? ""),
	});
	if (url.pathname === "/sparql") {
		expect(url.searchParams.get("query")).toContain("YEAR(?d) = 2016");
		response.setHeader("content-type", "application/sparql-results+json");
		response.end(
			JSON.stringify({
				results: {
					bindings: [
						binding(
							"32016R0679",
							"REG",
							"1",
							"Rozporządzenie o ochronie danych",
						),
						binding("32016R0680", "CORRIGENDUM", "1", "Sprostowanie"),
						binding("32016D0001", "DEC", "0", "Decyzja uchylona"),
						binding("../etc", "REG", "1", "nie CELEX"),
					],
				},
			}),
		);
	} else if (url.pathname === "/resource/celex/32016R0679") {
		response.setHeader("content-type", "application/xhtml+xml");
		response.end(
			"<html><body><p>Artykuł 1</p><p>Niniejsze rozporządzenie ustanawia przepisy.</p></body></html>",
		);
	} else response.writeHead(404).end();
});
await new Promise<void>((done) => source.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${(source.address() as AddressInfo).port}`;
process.env.EU_SPARQL = `${base}/sparql`;
process.env.EU_CELLAR = `${base}/resource`;
process.env.CRAWLEE_LOG_LEVEL = "OFF";
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-international-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");
const put = async (path: string, content: string) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(join(resources, path), content);
};
await put(
	"dataset/lists/publishers.json",
	JSON.stringify([{ code: "DU", name: "Dziennik Ustaw" }]),
);
await put(
	"dataset/acts/DU/2005.jsonl",
	[
		{
			ELI: "DU/2005/1",
			type: "Ustawa",
			title: "Ustawa",
			promulgation: "2005-01-02",
		},
		{
			ELI: "DU/2005/7",
			type: "Konwencja",
			title: "Konwencja o prawach",
			promulgation: "2005-03-01",
			status: "obowiązujący",
		},
		{
			ELI: "DU/2005/3",
			type: "Oświadczenie rządowe",
			title: "Oświadczenie rządowe w sprawie mocy",
			promulgation: "2005-02-01",
		},
	]
		.map(
			(act) =>
				`${JSON.stringify({ address: "W", publisher: "DU", year: 2005, pos: 1, textPDF: false, textHTML: false, ...act })}\n`,
		)
		.join(""),
);

const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => {
	server.close();
	source.close();
});

test("the law of the EU: a year's acts from SPARQL, the Polish texts of those in force", async () => {
	const { eu, yearPath, textPath } = await import(
		"../src/core/apihandlers/eu.js"
	);
	const store = await import("../src/core/resources/store.js");
	await eu({ years: [2016], texts: true, limit: 0, rate: 6000 });
	expect(store.readJsonl(yearPath(2016))).toEqual([
		{
			CELEX: "32016R0679",
			date: "2016-04-27",
			type: "REG",
			inForce: true,
			title: "Rozporządzenie o ochronie danych",
			ELI: "http://data.europa.eu/eli/x/32016R0679",
		},
		expect.objectContaining({ CELEX: "32016R0680", type: "CORRIGENDUM" }),
		expect.objectContaining({ CELEX: "32016D0001", inForce: false }),
	]); // "../etc" is no CELEX: left out
	// SPARQL asked for its JSON; one text asked for - in Polish, as XHTML - not the corrigendum's
	// nor the repealed decision's
	expect(asked.find((one) => one.path === "/sparql")?.accept).toBe(
		"application/sparql-results+json",
	);
	expect(asked.filter((one) => one.path.startsWith("/resource/"))).toEqual([
		{
			path: "/resource/celex/32016R0679",
			accept: "application/xhtml+xml",
			language: "pol",
		},
	]);
	expect(existsSync(textPath(2016, "32016R0679"))).toBe(true);

	const dataset = await import("../src/core/reading/dataset.js");
	expect(dataset.euYears()).toEqual([{ year: 2016, acts: 3 }]);
	expect(dataset.euActs(2016, { inForce: true }).total).toBe(2);
	const act = await dataset.euAct("32016R0679");
	expect(act?.text).toContain("Niniejsze rozporządzenie ustanawia przepisy.");
	expect(act?.eurlex).toBe(
		"https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:32016R0679",
	);
	expect(await dataset.euAct("../../etc")).toBeUndefined();
});

test("the agreements of the journals, and both in the api and MCP", async () => {
	const { international, agreementsPath } = await import(
		"../src/core/methods/international.js"
	);
	const store = await import("../src/core/resources/store.js");
	expect(await international()).toEqual({
		agreements: 2,
		kinds: { "Oświadczenie rządowe": 1, Konwencja: 1 },
	});
	expect(
		store.readJsonl<{ ELI: string }>(agreementsPath()).map((one) => one.ELI),
	).toEqual(["DU/2005/3", "DU/2005/7"]);
	const page = await (
		await fetch(`${url}/api/agreements?type=Konwencja`)
	).json();
	expect(page.items).toEqual([
		expect.objectContaining({ ELI: "DU/2005/7", status: "obowiązujący" }),
	]);
	expect(
		(await (await fetch(`${url}/api/eu/2016?inForce=1`)).json()).total,
	).toBe(2);

	const { connect } = await import("../src/mcp/client.js");
	const client = await connect(`${url}/mcp`);
	try {
		const said = (result: Awaited<ReturnType<typeof client.callTool>>) =>
			JSON.parse(
				(result.content as { text: string }[]).map((one) => one.text).join(""),
			);
		const one = said(
			await client.callTool({
				name: "eu_law",
				arguments: { celex: "32016R0679" },
			}),
		);
		expect(one.act.type).toBe("REG");
		const found = said(
			await client.callTool({
				name: "agreements",
				arguments: { query: "prawach" },
			}),
		);
		expect(found.total).toBe(1);
	} finally {
		await client.close();
	}
});
