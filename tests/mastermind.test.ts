import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// the law mastermind (phase 30) against a stand-in model: a year of three acts with vectors of
// three dimensions (tests/fixtures/embeddings), and an "Ollama" that answers as a model would
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-mastermind-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");
delete process.env.EMBED_MODEL;
const acts = [1, 2, 3].map((pos) => ({
	ELI: `DU/1918/${pos}`,
	address: `WDU1918000${pos}000${pos}`,
	publisher: "DU",
	year: 1918,
	pos,
	title: [
		"Dekret o Radzie Regencyjnej",
		"Ustawa o Radzie Stanu",
		"Dekret o szkołach",
	][pos - 1],
	type: pos === 2 ? "Ustawa" : "Dekret",
	status: "uchylony",
	textPDF: false,
	textHTML: true,
}));
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
for (const act of acts)
	await put(
		`dataset/texts/DU/1918/${act.address}.md`,
		`# ${act.title}\n\nArt. 1. Tekst aktu ${act.pos}.\n`,
	);
await cp(
	join(import.meta.dirname, "fixtures", "embeddings"),
	join(resources, "dataset", "embeddings"),
	{ recursive: true },
);

// the stand-in Ollama: a question is [0.6, 0.8, 0]; the model calls one tool (with a name the
// tool does not take and a number as words), then answers citing one act it read and one not
const chats: {
	messages: { role: string; content: string }[];
	tools?: unknown[];
}[] = [];
const model = createServer((request, response) => {
	let body = "";
	request.on("data", (chunk) => {
		body += chunk;
	});
	request.on("end", () => {
		if (request.url === "/api/embed") {
			response.setHeader("content-type", "application/json");
			response.end(JSON.stringify({ embeddings: [[0.6, 0.8, 0]] }));
			return;
		}
		const asked = JSON.parse(body);
		chats.push(asked);
		const lines =
			chats.length === 1
				? [
						{
							message: {
								role: "assistant",
								thinking: "I should read ",
								content: "",
							},
						},
						{
							message: {
								role: "assistant",
								content: "",
								tool_calls: [
									{
										function: {
											name: "act",
											arguments: { eli: "DU/1918/1", invented: "x" },
										},
									},
								],
							},
						},
						{ done: true },
					]
				: [
						{
							message: {
								role: "assistant",
								thinking: "the first act.",
								content: "",
							},
						},
						{
							message: {
								role: "assistant",
								content: "Rada Stanu stanowi prawo ",
							},
						},
						{
							message: {
								role: "assistant",
								content: "[DU/1918/2], jak [DU/1918/1]; zob. też [DU/1999/9].",
							},
						},
						{ done: true },
					];
		response.setHeader("content-type", "application/x-ndjson");
		// in two pieces, a line cut in the middle, as a stream may come
		const text = lines.map((line) => JSON.stringify(line)).join("\n");
		response.write(text.slice(0, 30));
		setTimeout(() => response.end(`${text.slice(30)}\n`), 10);
	});
});
await new Promise<void>((done) => model.listen(0, "127.0.0.1", done));
const ollama = `http://127.0.0.1:${(model.address() as AddressInfo).port}`;
process.env.OLLAMA_URL = ollama;

const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => {
	server.close();
	model.close();
});

test("search_meaning ranks the acts by the vectors of task embed", async () => {
	const { nearest } = await import("../src/core/reading/embeddings.js");
	expect(await nearest("Rada Stanu", { limit: 2 })).toEqual([
		{ ELI: "DU/1918/2", score: 0.8 },
		{ ELI: "DU/1918/1", score: 0.6 },
	]);
	const { connect } = await import("../src/mcp/client.js");
	const client = await connect(`${url}/mcp`);
	const found = await client.callTool({
		name: "search_meaning",
		arguments: { question: "Rada Stanu", limit: 1 },
	});
	expect(JSON.parse((found.content as { text: string }[])[0].text)).toEqual([
		{
			ELI: "DU/1918/2",
			score: 0.8,
			title: "Ustawa o Radzie Stanu",
			type: "Ustawa",
			status: "uchylony",
		},
	]);
	await client.close();
});

test("the mastermind reads through the MCP tools in rounds and checks what it cites", async () => {
	const { connect } = await import("../src/mcp/client.js");
	const { ask } = await import("../src/mastermind/ask.js");
	const client = await connect(`${url}/mcp`);
	const tokens: string[] = [];
	const advice = await ask("Czym była Rada Stanu?", client, {
		onToken: (text) => tokens.push(text),
		config: {
			url: ollama,
			model: "stand-in",
			key: "",
			rounds: 4,
			context: 4096,
			read: 2000,
			words: 512,
			first: 2,
		},
	});
	await client.close();
	// ours first: the nearest acts and the texts of two of them, given with the question
	expect(advice.steps.map((step) => [step.tool, step.arguments])).toEqual([
		["search_meaning", { question: "Czym była Rada Stanu?", limit: 8 }],
		["act_text", { eli: "DU/1918/2", length: 1500 }],
		["act_text", { eli: "DU/1918/1", length: 1500 }],
		// the model's own call, the name the tool does not take left out
		["act", { eli: "DU/1918/1" }],
	]);
	const first = chats[0].messages.at(-1)?.content ?? "";
	expect(first).toMatch(/^Acts nearest to the question by meaning:/);
	expect(first).toContain("The text of DU/1918/2:\n# Ustawa o Radzie Stanu");
	expect(first).toMatch(/The question: Czym była Rada Stanu\?$/);
	expect(chats[0].tools?.length).toBeGreaterThan(0);
	expect(chats[1].messages.at(-1)).toMatchObject({
		role: "tool",
		tool_name: "act",
	});
	expect(advice).toMatchObject({
		answer:
			"Rada Stanu stanowi prawo [DU/1918/2], jak [DU/1918/1]; zob. też [DU/1999/9].",
		thinking: "the first act.",
		rounds: 2,
		model: "stand-in",
		cited: [
			{ ELI: "DU/1918/2", read: true },
			{ ELI: "DU/1918/1", read: true },
			{ ELI: "DU/1999/9", read: false },
		],
	});
	expect(tokens.join("")).toContain("I should read");
});

test("/api/ask answers only where a mastermind is set, never on a public host", async () => {
	const ask = (question: string) =>
		fetch(`${url}/api/ask?question=${encodeURIComponent(question)}`);
	delete process.env.MASTERMIND_URL;
	expect((await ask("Rada Stanu")).status).toBe(503);
	process.env.MASTERMIND_URL = ollama;
	process.env.SPACE_ID = "Sarverott/docs-of-law-by-gov-in-poland";
	expect((await ask("Rada Stanu")).status).toBe(503);
	delete process.env.SPACE_ID;
	expect((await ask("")).status).toBe(400);
	delete process.env.MASTERMIND_URL;
});
