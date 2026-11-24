import { readFileSync } from "node:fs";
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
		if (request.url === "/api/show") {
			response.setHeader("content-type", "application/json");
			const { model } = JSON.parse(body);
			response.end(
				JSON.stringify({
					capabilities:
						model === "plain"
							? ["completion"]
							: ["completion", "tools", "thinking"],
				}),
			);
			return;
		}
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
			team: undefined,
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
	// the conversation kept: by family and instance, a file per session, the whole exchange
	expect(advice.record).toMatch(
		/conversations\/stand\/stand-in-latest\/\d{13}-czym-byla-rada-stanu\.json$/,
	);
	const kept = JSON.parse(readFileSync(advice.record, "utf8"));
	expect(kept).toMatchObject({ family: "stand", instance: "stand-in-latest" });
	expect(kept.settings.key).toBeUndefined();
	expect(kept.exchange.map((one: { role: string }) => one.role)).toEqual([
		"system",
		"user",
		"assistant",
		"tool",
		"assistant",
	]);
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

test("a model's family and instance name the folders of its conversations", async () => {
	const { familyOf, instanceOf } = await import("../src/mastermind/record.js");
	expect(
		[
			"gemma4:12b",
			"translategemma",
			"embeddinggemma:300m",
			"SpeakLeash/bielik-11b-v2.2-instruct:Q4_K_M",
			"ministral-3:8b",
			"deepseek-r1:8b",
			"phi4",
		].map((model) => [familyOf(model), instanceOf(model)]),
	).toEqual([
		["gemma", "gemma4-12b"],
		["gemma", "translategemma-latest"],
		["gemma", "embeddinggemma-300m"],
		["bielik", "SpeakLeash-bielik-11b-v2.2-instruct-Q4_K_M"],
		["mistral", "ministral-3-8b"],
		["deepseek", "deepseek-r1-8b"],
		["phi", "phi4-latest"],
	]);
});

test("a team: one calls the tools, one answers, one translates, one guards", async () => {
	// a stand-in Ollama that answers by the model asked
	const asked: {
		model: string;
		think?: boolean;
		tools?: unknown[];
		last: string;
	}[] = [];
	let calls = 0;
	const team = createServer((request, response) => {
		let body = "";
		request.on("data", (chunk) => {
			body += chunk;
		});
		request.on("end", () => {
			const data = JSON.parse(body || "{}");
			response.setHeader("content-type", "application/json");
			if (request.url === "/api/embed") {
				response.end(JSON.stringify({ embeddings: [[0.6, 0.8, 0]] }));
				return;
			}
			if (request.url === "/api/show") {
				response.end(
					JSON.stringify({
						capabilities:
							data.model === "caller"
								? ["completion", "tools"]
								: ["completion"],
					}),
				);
				return;
			}
			asked.push({
				model: data.model,
				think: data.think,
				tools: data.tools,
				last: data.messages.at(-1).content,
			});
			const message =
				data.model === "caller"
					? calls++ === 0
						? {
								content: "",
								tool_calls: [
									{
										function: { name: "act", arguments: { eli: "DU/1918/2" } },
									},
								],
							}
						: { content: "enough" }
					: data.model === "answerer"
						? { content: "The Council of State made laws [DU/1918/2]." }
						: data.model === "translator"
							? { content: "Rada Stanu stanowiła prawa [DU/1918/2]." }
							: { content: "No, the response does not violate the policy." };
			response.end(`${JSON.stringify({ message, done: true })}\n`);
		});
	});
	await new Promise<void>((done) => team.listen(0, "127.0.0.1", done));
	const at = `http://127.0.0.1:${(team.address() as AddressInfo).port}`;
	const { connect } = await import("../src/mcp/client.js");
	const { ask } = await import("../src/mastermind/ask.js");
	const client = await connect(`${url}/mcp`);
	process.env.MASTERMIND_KEEP = "0";
	const advice = await ask("Czym była Rada Stanu?", client, {
		config: {
			url: at,
			model: "answerer",
			key: "",
			rounds: 4,
			context: 4096,
			read: 2000,
			words: 512,
			first: 1,
			team: {
				name: "stand",
				answer: "answerer",
				tools: "caller",
				translate: "translator",
				guard: "guard",
			},
		},
	});
	delete process.env.MASTERMIND_KEEP;
	await client.close();
	team.close();
	expect(asked.map((one) => one.model)).toEqual([
		"caller",
		"caller",
		"answerer",
		"translator",
		"guard",
	]);
	// tools only to the one that calls them; thinking asked of none, as none can
	expect(asked[0].tools?.length).toBeGreaterThan(0);
	expect(asked[2].tools).toBeUndefined();
	expect(asked.every((one) => one.think === undefined)).toBe(true);
	// the one who answers gets what the caller gathered, with the question last
	expect(asked[2].last).toContain('What act {"eli":"DU/1918/2"} gave:');
	expect(asked[2].last).toMatch(/The question: Czym była Rada Stanu\?$/);
	expect(advice).toMatchObject({
		team: "stand",
		model: "answerer",
		original: "The Council of State made laws [DU/1918/2].",
		answer: "Rada Stanu stanowiła prawa [DU/1918/2].",
		guard: { by: "guard", verdict: "no" },
		cited: [{ ELI: "DU/1918/2", read: true }],
		record: "",
	});
});

test("an answer in English is not taken for Polish", async () => {
	const { polish } = await import("../src/mastermind/team.js");
	expect(polish("The acts you read do not answer the question.")).toBe(false);
	expect(polish("To jest ustawa, która nie obowiązuje")).toBe(true);
	expect(polish("Rada Stanu składała się ze 110 członków")).toBe(true);
});

test("write_note writes a bare name into its folder, never outside it", async () => {
	const { noteTool } = await import("../src/mastermind/note.js");
	const folder = join(work, "agent");
	const note = noteTool(folder);
	expect(await note.run({ name: "../../AGENTS.md", content: "# x" })).toEqual({
		ok: true,
		text: "written resources/agent/AGENTS.md (3 characters)",
	});
	expect(readFileSync(join(folder, "AGENTS.md"), "utf8")).toBe("# x\n");
	expect(
		(await note.run({ name: "/etc/passwd", content: "y" })).text,
	).toContain("resources/agent/passwd.md");
	expect((await note.run({ name: "..", content: "z" })).ok).toBe(false);
	expect((await note.run({ name: "a.md", content: "" })).ok).toBe(false);
});

test("the executive agent's own tool runs in the rounds beside MCP's", async () => {
	let calls = 0;
	const model = createServer((request, response) => {
		request.resume();
		request.on("end", () => {
			response.setHeader("content-type", "application/json");
			if (request.url === "/api/show") {
				response.end(JSON.stringify({ capabilities: ["completion", "tools"] }));
				return;
			}
			if (request.url === "/api/embed") {
				response.end(JSON.stringify({ embeddings: [[0.6, 0.8, 0]] }));
				return;
			}
			const message =
				calls++ === 0
					? {
							content: "",
							tool_calls: [
								{
									function: {
										name: "write_note",
										arguments: {
											name: "rada.md",
											content: "# Rada Stanu [DU/1918/2]",
										},
									},
								},
							],
						}
					: { content: "Zapisano [DU/1918/2]." };
			response.end(`${JSON.stringify({ message, done: true })}\n`);
		});
	});
	await new Promise<void>((done) => model.listen(0, "127.0.0.1", done));
	const at = `http://127.0.0.1:${(model.address() as AddressInfo).port}`;
	const { connect } = await import("../src/mcp/client.js");
	const { ask } = await import("../src/mastermind/ask.js");
	const { noteTool } = await import("../src/mastermind/note.js");
	const client = await connect(`${url}/mcp`);
	const folder = join(work, "agent-run");
	const advice = await ask("Zapisz notatkę o Radzie Stanu.", client, {
		keep: false,
		system: "You are the executive agent.",
		local: [noteTool(folder)],
		config: {
			url: at,
			model: "qwen-stand-in",
			key: "",
			rounds: 4,
			context: 4096,
			read: 2000,
			words: 512,
			first: 1,
			team: undefined,
		},
	});
	await client.close();
	model.close();
	expect(advice.steps.map((one) => [one.tool, one.ok])).toEqual([
		["search_meaning", true],
		["act_text", true],
		["write_note", true],
	]);
	expect(readFileSync(join(folder, "rada.md"), "utf8")).toBe(
		"# Rada Stanu [DU/1918/2]\n",
	);
	expect(advice.answer).toBe("Zapisano [DU/1918/2].");
});

test("the advanced strategy: a weak answer of the small model goes on to the hosted deepseek", async () => {
	// the small one of the host (Ollama's dialect) answers what is given in the question
	let smallSays = "";
	const small = createServer((request, response) => {
		request.resume();
		request.on("end", () => {
			response.setHeader("content-type", "application/json");
			if (request.url === "/api/show")
				response.end(JSON.stringify({ capabilities: ["completion"] }));
			else if (request.url === "/api/embed")
				response.end(JSON.stringify({ embeddings: [[0.6, 0.8, 0]] }));
			else
				response.end(
					`${JSON.stringify({ message: { content: smallSays }, done: true })}\n`,
				);
		});
	});
	// the hosted one (Inference Providers: the OpenAI dialect, streamed)
	const heard: { authorization: string; model: string; asked: string }[] = [];
	const hosted = createServer((request, response) => {
		let body = "";
		request.on("data", (chunk) => {
			body += chunk;
		});
		request.on("end", () => {
			const data = JSON.parse(body);
			heard.push({
				authorization: String(request.headers.authorization),
				model: data.model,
				asked: data.messages.at(-1).content,
			});
			response.setHeader("content-type", "text/event-stream");
			response.end(
				`data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: "Czytam DU/1918/2." } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: { content: "Rada Stanu doradzała [DU/1918/2]." } }] })}\n\ndata: [DONE]\n\n`,
			);
		});
	});
	for (const one of [small, hosted])
		await new Promise<void>((done) => one.listen(0, "127.0.0.1", done));
	const port = (one: typeof small) => (one.address() as AddressInfo).port;
	const { connect } = await import("../src/mcp/client.js");
	const { strategy, weak } = await import("../src/mastermind/strategy.js");
	const client = await connect(`${url}/mcp`);
	const config = {
		url: `http://127.0.0.1:${port(small)}`,
		model: "deepseek-r1:8b",
		key: "",
		rounds: 2,
		context: 4096,
		read: 2000,
		words: 512,
		first: 1,
		team: undefined,
	};
	const hard = {
		url: `http://127.0.0.1:${port(hosted)}/v1`,
		model: "deepseek-ai/DeepSeek-R1-0528",
		key: "hf_owner",
	};
	try {
		// cited what it never opened: weak, so the deepseek answers, given the small one's answer
		smallSays = "Rada Stanu to [DU/1918/3].";
		const escalated = await strategy("Czym była Rada Stanu?", client, {
			keep: false,
			config,
			hard,
		});
		expect(escalated.model).toBe("deepseek-ai/DeepSeek-R1-0528");
		expect(escalated.answer).toBe("Rada Stanu doradzała [DU/1918/2].");
		expect(escalated.thinking).toBe("Czytam DU/1918/2.");
		expect(escalated.escalated).toMatchObject({
			from: "deepseek-r1:8b",
			answer: "Rada Stanu to [DU/1918/3].",
			why: ["it cited DU/1918/3 without reading"],
		});
		expect(heard).toHaveLength(1);
		expect(heard[0]).toMatchObject({
			authorization: "Bearer hf_owner",
			model: "deepseek-ai/DeepSeek-R1-0528",
		});
		expect(heard[0].asked).toContain(
			"A smaller model (deepseek-r1:8b) answered first",
		);
		expect(heard[0].asked).toContain("Rada Stanu to [DU/1918/3].");

		// what it cites read: the small one's answer stands, the hosted one is not asked
		smallSays = `Rada Stanu [${escalated.steps[1].arguments.eli}].`;
		const kept = await strategy("Czym była Rada Stanu?", client, {
			keep: false,
			config,
			hard,
		});
		expect(weak(kept)).toEqual([]);
		expect(kept.model).toBe("deepseek-r1:8b");
		expect(kept.escalated).toBeUndefined();
		expect(heard).toHaveLength(1);

		// hard: straight there; without a token, refused before anything is asked
		const straight = await strategy("Czym była Rada Stanu?", client, {
			keep: false,
			config,
			hard,
			mode: "hard",
		});
		expect(straight.model).toBe("deepseek-ai/DeepSeek-R1-0528");
		expect(straight.escalated).toBeUndefined();
		await expect(
			strategy("Czym była Rada Stanu?", client, {
				keep: false,
				config,
				hard: { ...hard, key: "" },
				mode: "hard",
			}),
		).rejects.toThrow(/needs a token/);
		expect(heard).toHaveLength(2);
		expect(weak({ ...kept, answer: " " })).toEqual(["it said nothing"]);
		expect(weak({ ...kept, cited: [] })).toEqual(["it cited no act"]);
	} finally {
		await client.close();
		small.close();
		hosted.close();
	}
});
