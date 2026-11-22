import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// a stand-in for Typesense: remembers what it was asked, answers like the real one
const asked: { method: string; url: string; key: string; body: string }[] = [];
let collection = false;
const typesense = createServer((request, response) => {
	let body = "";
	request.on("data", (chunk) => {
		body += chunk;
	});
	request.on("end", () => {
		asked.push({
			method: request.method ?? "",
			url: request.url ?? "",
			key: String(request.headers["x-typesense-api-key"]),
			body,
		});
		const url = request.url ?? "";
		if (url === "/collections/acts" && !collection) {
			response.writeHead(404).end("{}");
		} else if (url === "/collections" && request.method === "POST") {
			collection = true;
			response.writeHead(201).end("{}");
		} else if (url.startsWith("/collections/acts/documents/import")) {
			response.end(
				body
					.split("\n")
					.map(() => '{"success":true}')
					.join("\n"),
			);
		} else if (url === "/api/embed") {
			response.setHeader("content-type", "application/json");
			response.end(JSON.stringify({ embeddings: [[0.6, 0.8, 0]] }));
		} else if (url === "/multi_search") {
			response.setHeader("content-type", "application/json");
			response.end(
				JSON.stringify({
					results: [{ found: 0, page: 1, hits: [], facet_counts: [] }],
				}),
			);
		} else if (url.startsWith("/collections/acts/documents/search")) {
			response.setHeader("content-type", "application/json");
			response.end(
				JSON.stringify({
					found: 1,
					page: 1,
					hits: [
						{
							document: {
								eli: "DU/1918/2",
								title: "Ustawa o Radzie Stanu",
								type: "Ustawa",
								status: "uchylony",
								year: 1918,
							},
							highlights: [{ field: "text", snippet: "My, <mark>RADA</mark>" }],
						},
					],
					facet_counts: [
						{ field_name: "type", counts: [{ value: "Ustawa", count: 1 }] },
					],
				}),
			);
		} else response.writeHead(200).end("{}");
	});
});
await new Promise<void>((done) => typesense.listen(0, "127.0.0.1", done));
process.env.TYPESENSE_URL = `http://127.0.0.1:${(typesense.address() as AddressInfo).port}`;
process.env.TYPESENSE_API_KEY = "test-key";
// the same stand-in answers as Ollama
process.env.OLLAMA_URL = process.env.TYPESENSE_URL;

const work = await mkdtemp(join(tmpdir(), "p-jol-roll-search-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");
const put = async (path: string, content: string) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(join(resources, path), content);
};
const act = {
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
};
await put("dataset/acts/DU/1918.jsonl", `${JSON.stringify(act)}\n`);
await put(
	"dataset/details/DU/1918.jsonl",
	`${JSON.stringify({ ...act, keywords: ["rada stanu"] })}\n`,
);
await put("dataset/texts/DU/1918/WDU19180020002.md", "My, RADA REGENCYJNA\n");
await put(".map.json", "{}");
await put(
	"dataset/embeddings/bge-m3/model.json",
	JSON.stringify({ model: "bge-m3", dimensions: 3 }),
);

const { index } = await import("../src/core/search/typesense.js");
const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => {
	server.close();
	typesense.close();
});

test("index makes the collection once and sends every act with its keywords and text", async () => {
	expect(await index({ texts: true })).toEqual({ acts: 1, failed: 0 });
	expect(asked.every(({ key }) => key === "test-key")).toBe(true);
	const schema = JSON.parse(
		asked.find(({ url }) => url === "/collections")?.body ?? "{}",
	);
	expect(schema.name).toBe("acts");
	const imported = asked.find(({ url }) =>
		url.includes("/import?action=upsert"),
	);
	expect(JSON.parse(imported?.body ?? "{}")).toMatchObject({
		id: "DU-1918-2",
		eli: "DU/1918/2",
		keywords: ["rada stanu"],
		text: "My, RADA REGENCYJNA\n",
		year: 1918,
	});
	asked.length = 0;
	await index();
	expect(asked.filter(({ url }) => url === "/collections")).toHaveLength(0);
	expect(asked.at(-1)?.body).not.toContain("text");
});

test("the api asks with filters and gives acts, snippets and facets", async () => {
	asked.length = 0;
	const answer = await (
		await fetch(`${url}/api/search?q=rada&type=Ustawa&journal=DU&page=2`)
	).json();
	expect(answer).toEqual({
		total: 1,
		page: 1,
		meaning: false,
		items: [
			{
				ELI: "DU/1918/2",
				title: "Ustawa o Radzie Stanu",
				type: "Ustawa",
				status: "uchylony",
				year: 1918,
				snippet: "My, <mark>RADA</mark>",
			},
		],
		facets: { type: [{ value: "Ustawa", count: 1 }] },
	});
	const query = new URL(`http://x${asked[0].url}`).searchParams;
	expect(query.get("q")).toBe("rada");
	expect(query.get("page")).toBe("2");
	expect(query.get("filter_by")).toBe("publisher:=DU && type:=`Ustawa`");
});

test("by meaning the question becomes a vector and the search is hybrid", async () => {
	asked.length = 0;
	const answer = await (
		await fetch(`${url}/api/search?q=ochrona%20danych&meaning=1`)
	).json();
	expect(answer.meaning).toBe(true);
	expect(JSON.parse(asked[0].body)).toMatchObject({
		model: "bge-m3",
		input: ["ochrona danych"],
	});
	const [search] = JSON.parse(asked[1].body).searches;
	expect(search).toMatchObject({
		collection: "acts",
		q: "ochrona danych",
		exclude_fields: "embedding",
		vector_query: "embedding:([0.6,0.8,0], k:200, alpha:0.4)",
	});
});

test("without Typesense the api says how to start it", async () => {
	typesense.close();
	await new Promise((done) => setTimeout(done, 50));
	const answer = await fetch(`${url}/api/search?q=rada`);
	expect(answer.status).toBe(503);
	expect((await answer.json()).error).toContain(
		"docker compose --profile search up -d typesense",
	);
});
