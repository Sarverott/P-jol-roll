import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { io } from "socket.io-client";
import { afterAll, expect, test } from "vitest";

// a small gathered year, written as the gatherer and "task text" would leave it
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-reading-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");

const acts = [
	{
		ELI: "DU/1918/1",
		address: "WDU19180010001",
		publisher: "DU",
		year: 1918,
		pos: 1,
		title: "Dekret o Radzie Regencyjnej",
		type: "Dekret",
		status: "uchylony",
		textPDF: true,
		textHTML: false,
	},
	{
		ELI: "DU/1918/2",
		address: "WDU19180020002",
		publisher: "DU",
		year: 1918,
		pos: 2,
		title: "Ustawa o Radzie Stanu",
		type: "Ustawa",
		status: "uchylony",
		textPDF: true,
		textHTML: true,
	},
];
const put = async (path: string, content: string) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(join(resources, path), content);
};
await put(
	"dataset/acts/DU/1918.jsonl",
	acts.map((act) => `${JSON.stringify(act)}\n`).join(""),
);
await put(
	"dataset/lists/publishers.json",
	JSON.stringify([{ code: "DU", name: "Dziennik Ustaw" }]),
);
await put(
	"bucket/DU/1918/WDU19180020002.json",
	JSON.stringify({
		...acts[1],
		references: { "Akty wykonawcze": [{ id: "DU/1918/20" }] },
	}),
);
await put("bucket/DU/1918/WDU19180020002.pdf", "%PDF-1.4");
await put(
	"dataset/texts/DU/1918/WDU19180020002.md",
	"# Ustawa o Radzie Stanu\n\n### Art. 1.\n",
);
await put(
	"dataset/texts/DU/1918.jsonl",
	`${JSON.stringify({
		ELI: "DU/1918/2",
		markdown: "texts/DU/1918/WDU19180020002.md",
		sha256_md: "-",
		from: "pdf",
		sha256_pdf: "-",
		producer: "Adobe Acrobat 9.0 Paper Capture Plug-in",
		url: "https://api.sejm.gov.pl/eli/acts/DU/1918/2/text.pdf",
	})}\n`,
);
await put(".map.json", "{}");
// the rest of the dataset: a list of the source, a term of Sejm, a month of judgments
await put("dataset/lists/statuses.json", JSON.stringify(["obowiązujący"]));
await put(
	"dataset/sejm/term10/processes.jsonl",
	`${JSON.stringify({ term: 10, number: "1", title: "Projekt uchwały o wicemarszałkach" })}\n${JSON.stringify({ term: 10, number: "2", title: "Projekt ustawy o podatkach" })}\n`,
);
await put(
	"dataset/SAOS/judgments/2020/2020-03.jsonl",
	`${JSON.stringify({ id: 7, courtType: "COMMON" })}\n`,
);

const library = await import("../src/core/reading/library.js");
const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => server.close());

test("reads journals, pages of acts and one act from files", () => {
	expect(library.journals()).toEqual([
		{ code: "DU", name: "Dziennik Ustaw", years: [1918] },
	]);
	expect(
		library
			.acts("DU", 1918, { query: "radzie STANU" })
			.items.map((act) => act.ELI),
	).toEqual(["DU/1918/2"]);
	expect(library.acts("DU", 1918, { offset: 1, limit: 1 })).toMatchObject({
		total: 2,
		offset: 1,
	});
	expect(library.act("DU/1918/2")).toMatchObject({
		files: [".json", ".pdf"],
		markdown: true,
		text: {
			from: "pdf",
			producer: "Adobe Acrobat 9.0 Paper Capture Plug-in",
			url: "https://api.sejm.gov.pl/eli/acts/DU/1918/2/text.pdf",
		},
	});
	expect(library.act("DU/1918/1")).toMatchObject({
		files: [],
		markdown: false,
	});
	expect(library.references("DU/1918/2")).toEqual([
		{ from: "DU/1918/2", type: "Akty wykonawcze", to: "DU/1918/20" },
	]);
	expect(library.act("DU/1918/9")).toBeUndefined();
	expect(library.parseEli("../../etc")).toBeUndefined();
});

test("http api answers from the same files and nothing outside them", async () => {
	const get = (path: string) => fetch(`${url}${path}`);
	expect(await (await get("/api/journals")).json()).toHaveLength(1);
	expect((await (await get("/api/acts/DU/1918?q=dekret")).json()).total).toBe(
		1,
	);
	const text = await get("/api/acts/DU/1918/2/text");
	expect(text.headers.get("content-type")).toContain("text/markdown");
	expect(await text.text()).toContain("Art. 1.");
	expect(text.headers.get("access-control-allow-origin")).toBe("*");
	expect(text.headers.get("x-text-from")).toBe("pdf");
	const diagram = await get("/api/acts/DU/1918/2/diagram");
	expect(diagram.headers.get("content-type")).toContain("text/vnd.mermaid");
	expect(await diagram.text()).toContain('subgraph g1["Akty wykonawcze"]');
	expect(await (await get("/api/acts/DU/1918/2/file/.pdf")).text()).toBe(
		"%PDF-1.4",
	);
	expect((await get("/api/acts/DU/1918/2/file/.env")).status).toBe(404);
	expect(
		(await get("/api/acts/DU/1918/2/file/..%2F..%2F.map.json")).status,
	).toBe(404);
	expect((await get("/api/acts/DU/1918/1/text")).status).toBe(404);
	expect((await (await get("/openapi.json")).json()).openapi).toBe("3.1.0");
});

test("the rest of the dataset: statistics, lists, Sejm, judgments", async () => {
	const get = async (path: string) => (await fetch(`${url}${path}`)).json();
	const counted = await get("/api/statistics");
	expect(counted.years).toEqual([
		{
			journal: "DU",
			year: 1918,
			total: 2,
			types: { Dekret: 1, Ustawa: 1 },
			statuses: { uchylony: 2 },
		},
	]);
	expect(counted.statuses).toEqual(["uchylony"]);
	expect(await get("/api/lists")).toEqual(["publishers", "statuses"]);
	expect(await get("/api/lists/statuses")).toEqual(["obowiązujący"]);
	expect((await fetch(`${url}/api/lists/..%2F.map`)).status).toBe(404);
	expect(await get("/api/sejm")).toEqual([
		{ term: 10, processes: 2, prints: 0 },
	]);
	const found = await get("/api/sejm/10/processes?q=podatkach");
	expect(found.items.map((one: { number: string }) => one.number)).toEqual([
		"2",
	]);
	expect((await fetch(`${url}/api/sejm/10/votes`)).status).toBe(404);
	expect(await get("/api/judgments")).toEqual(["2020-03"]);
	const catalog = await get("/api/catalog");
	expect(
		catalog.find((one: { name: string }) => one.name === "acts"),
	).toMatchObject({ group: "read", reads: true, allowed: true });
	expect(
		catalog.find((one: { name: string }) => one.name === "gather"),
	).toMatchObject({ writes: true, allowed: false, task: "gather" });
	expect((await get("/api/judgments/2020/3")).total).toBe(1);
});

test("socket.io tells what is here and what changed", async () => {
	const socket = io(url, { transports: ["websocket"] });
	const journals = await new Promise((done) => socket.once("journals", done));
	expect(journals).toHaveLength(1);
	const changed = new Promise<string[]>((done) => socket.once("changed", done));
	await put("dataset/acts/DU/1919.jsonl", "");
	expect((await changed).some((path) => path.includes("1919"))).toBe(true);
	socket.close();
}, 10000);

test("the MCP server answers at /mcp of the api with the same reading", async () => {
	const { connect } = await import("../src/mcp/client.js");
	const client = await connect(`${url}/mcp`);
	const { tools } = await client.listTools();
	expect(tools.map((tool) => tool.name).sort()).toEqual(
		[
			"act",
			"act_debates",
			"act_references",
			"act_text",
			"analysis",
			"journals",
			"search_acts",
			"search_meaning",
			"sejm_work",
			"source_list",
			"statistics",
		].sort(),
	);
	const text = (result: Awaited<ReturnType<typeof client.callTool>>) =>
		(result.content as { text: string }[])[0].text;
	const found = await client.callTool({
		name: "search_acts",
		arguments: { journal: "DU", year: 1918, query: "stanu" },
	});
	expect(
		JSON.parse(text(found)).items.map((act: { ELI: string }) => act.ELI),
	).toEqual(["DU/1918/2"]);
	const read = await client.callTool({
		name: "act_text",
		arguments: { eli: "DU/1918/2" },
	});
	expect(text(read)).toMatch(
		/^\[text layer of the PDF .*\n\n# Ustawa o Radzie Stanu/,
	);
	const work = await client.callTool({
		name: "sejm_work",
		arguments: { term: 10, query: "uchwały" },
	});
	expect(JSON.parse(text(work)).total).toBe(1);
	const missing = await client.callTool({
		name: "act",
		arguments: { eli: "DU/1918/9" },
	});
	expect(missing.isError).toBe(true);
	await client.close();
});
