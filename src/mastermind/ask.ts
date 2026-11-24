import type { Client } from "@modelcontextprotocol/client";
import { OLLAMA_URL } from "../core/reading/embeddings.js";
import type { MastermindScope } from "../core/vars/interfaces/index.js";
import {
	type Call,
	chat,
	type Message,
	type Reply,
	type Tool,
} from "./model.js";
import { keep } from "./record.js";
import { guarded, polish, type Team, teamOf, translated } from "./team.js";

/*
The law mastermind's first voice (phase 30, Q18): a question in words answered by a model that
reads the law through the MCP tools of src/mcp and cites every act it leans on by its ELI.
In rounds: the acts nearest to the question by meaning are found first (search_meaning, so even
a model that calls no tool starts from the law), then the model calls tools - act, act_text,
search_acts... - as long as it wants, at most MASTERMIND_ROUNDS times, and answers. The ELIs of
its answer are checked against what the tools gave: one it never read is marked so.

The model speaks one of two dialects:
  Ollama's own /api/chat   MASTERMIND_URL unset or an Ollama (default OLLAMA_URL, the host's
                           GPU in development): its context set by MASTERMIND_CONTEXT
  an OpenAI-like api       MASTERMIND_URL ending in /v1 (LiteLLM of the profile llms, Ollama's
                           /v1, any other), with MASTERMIND_KEY when it wants one
MASTERMIND_MODEL names the model, deepseek-r1:8b by default. Not legal advice: a devil's
advocate everyone can afford, as the owner put it.
*/

// a tool of the caller's own beside the MCP server's (the executive agent's writing)
export type LocalTool = Tool & {
	run: (
		input: Record<string, unknown>,
	) => Promise<{ ok: boolean; text: string }>;
};

export const settings = () => ({
	url: (process.env.MASTERMIND_URL || OLLAMA_URL).replace(/\/+$/, ""),
	// a team of one family (team.ts): MASTERMIND_TEAM=gemma; its answer the model unless named
	team: teamOf(process.env.MASTERMIND_TEAM) as Team | undefined,
	model:
		process.env.MASTERMIND_MODEL ||
		teamOf(process.env.MASTERMIND_TEAM)?.answer ||
		"deepseek-r1:8b",
	key: process.env.MASTERMIND_KEY || "",
	rounds: Number(process.env.MASTERMIND_ROUNDS) || 6,
	context: Number(process.env.MASTERMIND_CONTEXT) || 16384,
	read: Number(process.env.MASTERMIND_READ) || 6000, // characters of one tool's answer kept
	words: Number(process.env.MASTERMIND_WORDS) || 4096, // tokens it may write, thinking too
	first: Number(process.env.MASTERMIND_FIRST ?? 3), // texts of the nearest acts read before it speaks
});

const SYSTEM = `You answer questions about the law of Poland. You know only what the tools give you: \
acts of Dziennik Ustaw (DU) and Monitor Polski (MP), each named by its ELI, journal/year/position, \
for example DU/<year>/<position>. The acts nearest to the question by meaning are already found below, and the texts of the nearest ones read; read \
more of them with act_text (and act for their status), search more with search_meaning or \
search_acts when you need. Then answer in the language of the question, plainly, saying which \
provisions say so. Cite every act you rely on by its ELI in square brackets, like [DU/<year>/<position>], and only \
acts you read. Say when an act is no longer in force (its status) and when the acts you read do not \
answer the question. This is not legal advice.`;

const ELI = /\b(?:DU|MP)\/\d{4}\/\d+\b/g;
// the tools that open one act: an ELI given to one of them is an act read
const OPENING = new Set(["act", "act_text", "act_references"]);

// the arguments as the tool's schema wants them: "2026" a number where a number is asked,
// names it does not take left out (small models invent both)
function fitted(arguments_: Record<string, unknown>, schema: unknown) {
	const properties =
		(schema as { properties?: Record<string, { type?: string }> })
			?.properties ?? {};
	return Object.fromEntries(
		Object.entries(arguments_)
			.filter(([name]) => name in properties)
			.map(([name, value]) => {
				const type = properties[name]?.type;
				return (type === "integer" || type === "number") &&
					typeof value === "string" &&
					/^-?\d+(\.\d+)?$/.test(value.trim())
					? [name, Number(value)]
					: [name, value];
			}),
	);
}

// "<think>...</think>answer" -> its two parts (models that think inside their content)
function split(content: string, thinking: string) {
	const inside = content.match(/<think>([\s\S]*?)<\/think>/);
	return {
		answer: content.replace(/<think>[\s\S]*?<\/think>/, "").trim(),
		thinking: (thinking || inside?.[1] || "").trim(),
	};
}

export async function ask(
	question: string,
	client: Client,
	{
		onStep = (_step: MastermindScope.Advice["steps"][number]) => {},
		onToken = (_text: string) => {},
		config = settings(),
		keep: keeping = true, // a visitor's conversation on the demo is not kept
		// the executive agent (agent.ts): its own instructions, and tools of its own beside MCP's
		system = SYSTEM,
		local = [] as LocalTool[],
	} = {},
): Promise<MastermindScope.Advice> {
	const started = Date.now();
	const tools: Tool[] = [
		...(await client.listTools()).tools,
		...local.map(({ name, description, inputSchema }) => ({
			name,
			description,
			inputSchema,
		})),
	];
	const steps: MastermindScope.Advice["steps"] = [];
	const read = new Set<string>();
	const messages: Message[] = [{ role: "system", content: system }];

	// one tool through MCP: its answer shortened; an act it opened remembered as read
	const call = async (one: Call) => {
		let text: string;
		let ok = true;
		try {
			const tool = tools.find((each) => each.name === one.name);
			if (tool) one.arguments = fitted(one.arguments, tool.inputSchema);
			const own = local.find((each) => each.name === one.name);
			if (own) ({ ok, text } = await own.run(one.arguments));
			else {
				const result = await client.callTool({
					name: one.name,
					arguments: one.arguments,
				});
				text = (result.content as { type: string; text?: string }[])
					.map((part) => part.text ?? "")
					.join("\n");
				ok = !result.isError;
			}
		} catch (error) {
			text = `the tool failed: ${(error as Error).message}`;
			ok = false;
		}
		const opened = String(one.arguments.eli ?? "");
		if (ok && OPENING.has(one.name) && opened) read.add(opened);
		const step = { tool: one.name, arguments: one.arguments, ok };
		steps.push(step);
		onStep(step);
		return {
			ok,
			text:
				text.length > config.read
					? `${text.slice(0, config.read)}\n[... cut at ${config.read} of ${text.length} characters: read on with start]`
					: text,
		};
	};

	/*
	The first round is ours, through the same tools: the acts nearest to the question by
	meaning, and the texts of the nearest ones, given with the question itself - a small
	distilled model seldom calls a tool, and the pieces of a conversation with tools confuse
	the template of deepseek-R1, which then imitates them instead of answering.
	*/
	const context: string[] = [];
	if (tools.some((tool) => tool.name === "search_meaning")) {
		const found = await call({
			id: "start",
			name: "search_meaning",
			arguments: { question, limit: 8 },
		});
		if (found.ok) {
			context.push(`Acts nearest to the question by meaning:\n${found.text}`);
			const nearest = (
				JSON.parse(found.text.split("\n[... cut")[0]) as { ELI: string }[]
			)
				.slice(0, config.first)
				.map((one) => one.ELI);
			for (const eli of nearest) {
				const text = await call({
					id: `read-${eli}`,
					name: "act_text",
					arguments: {
						eli,
						length: Math.max(1000, Math.floor(config.read * 0.75)),
					},
				});
				if (text.ok) context.push(`The text of ${eli}:\n${text.text}`);
			}
		}
	}
	messages.push({
		role: "user",
		content: context.length
			? `${context.join("\n\n---\n\n")}\n\n---\n\nThe question: ${question}`
			: question,
	});

	// the team's caller of tools, when it has one, holds the rounds; the one who answers writes
	const caller =
		config.team?.tools && config.team.tools !== config.model
			? { ...config, model: config.team.tools }
			: config;
	let rounds = 0;
	let last: Reply = { content: "", thinking: "", calls: [] };
	while (rounds < config.rounds) {
		rounds++;
		last = await chat(
			caller,
			messages,
			rounds < config.rounds ? tools : [],
			onToken,
		);
		if (!last.calls.length) break;
		messages.push({
			role: "assistant",
			content: last.content,
			calls: last.calls,
		});
		for (const one of last.calls)
			messages.push({
				role: "tool",
				content: (await call(one)).text,
				call: one,
			});
	}
	if (caller !== config) {
		// what the caller of tools gathered, given to the one who answers with the question
		const gathered = messages
			.filter((one) => one.role === "tool")
			.map(
				(one) =>
					`What ${one.call.name} ${JSON.stringify(one.call.arguments)} gave:\n${one.content}`,
			);
		messages.push({
			role: "user",
			content: [
				...context,
				...gathered,
				`Answer now, from what is above. The question: ${question}`,
			].join("\n\n---\n\n"),
		});
		rounds++;
		last = await chat(
			config,
			[messages[0], messages.at(-1) as Message],
			[],
			onToken,
		);
	} else if (last.calls.length) {
		// it still wanted tools when the rounds ran out: once more, without them
		rounds++;
		last = await chat(config, messages, [], onToken);
	}
	const said = split(last.content, last.thinking);
	let { answer } = said;
	const { thinking } = said;
	// an answer given in another language turned into the question's, by the team's translator
	let original = "";
	if (config.team?.translate && polish(question) && answer && !polish(answer)) {
		original = answer;
		answer = await translated(config, config.team.translate, answer);
	}
	const guard = config.team?.guard
		? await guarded(config, config.team.guard, question, answer)
		: null;
	const advice = {
		question,
		answer,
		thinking,
		cited: [...new Set(answer.match(ELI) ?? [])].map((one) => ({
			ELI: one,
			read: read.has(one),
		})),
		steps,
		model: config.model,
		team: config.team?.name ?? "",
		original,
		guard,
		rounds,
		record: "",
	};
	// kept with everything it was given and said (record.ts); the key never
	const { key: _key, ...settings } = config;
	advice.record = keeping
		? keep(
				advice,
				[
					...messages,
					{ role: "assistant", content: last.content, thinking: last.thinking },
				],
				{ url: config.url, started, settings },
			)
		: "";
	return advice;
}
