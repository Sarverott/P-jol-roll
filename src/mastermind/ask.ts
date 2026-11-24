import type { Client } from "@modelcontextprotocol/client";
import { OLLAMA_URL } from "../core/reading/embeddings.js";
import type { MastermindScope } from "../core/vars/interfaces/index.js";

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

export const settings = () => ({
	url: (process.env.MASTERMIND_URL || OLLAMA_URL).replace(/\/+$/, ""),
	model: process.env.MASTERMIND_MODEL || "deepseek-r1:8b",
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
const WRITTEN =
	/<｜tool▁call▁begin｜>\s*function\s*<｜tool▁sep｜>\s*([\w-]+)\s*(?:```(?:json)?)?\s*(\{[\s\S]*?\})\s*(?:```)?\s*<｜tool▁call▁end｜>/g;

// the tools that open one act: an ELI given to one of them is an act read
const OPENING = new Set(["act", "act_text", "act_references"]);

const parsed = (text: string): Record<string, unknown> => {
	try {
		return JSON.parse(text);
	} catch {
		return {};
	}
};

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

type Call = { id: string; name: string; arguments: Record<string, unknown> };
type Message =
	| { role: "system" | "user"; content: string }
	| { role: "assistant"; content: string; calls: Call[] }
	| { role: "tool"; content: string; call: Call };
type Reply = { content: string; thinking: string; calls: Call[] };
type Tool = { name: string; description?: string; inputSchema: unknown };

type Streamed = {
	content: string;
	thinking: string;
	tool_calls: { id?: string; function: { name: string; arguments: unknown } }[];
};

/*
The answer read as it is written: a thinking model may think for many minutes before its
first word, longer than fetch waits for an answer that comes at once. Ollama sends a line of
JSON per piece, an OpenAI-like api "data: {...}" lines with deltas.
*/
async function streamed(
	answer: globalThis.Response,
	openai: boolean,
	onToken: (text: string) => void,
): Promise<Streamed> {
	const message: Streamed = { content: "", thinking: "", tool_calls: [] };
	const pieces: Record<
		number,
		{ id?: string; name: string; arguments: string }
	> = {};
	const take = (line: string) => {
		const json = openai ? line.replace(/^data:\s*/, "") : line;
		if (
			!json.trim() ||
			json.trim() === "[DONE]" ||
			(openai && !line.startsWith("data:"))
		)
			return;
		const data = JSON.parse(json);
		const part = openai ? data.choices?.[0]?.delta : data.message;
		if (!part) return;
		const thinking =
			part.thinking ?? part.reasoning_content ?? part.reasoning ?? "";
		message.thinking += thinking;
		message.content += part.content ?? "";
		if (thinking || part.content) onToken(thinking || part.content);
		for (const [i, call] of (part.tool_calls ?? []).entries()) {
			if (!openai) message.tool_calls.push(call);
			else {
				const at = call.index ?? i;
				pieces[at] ??= { id: call.id, name: "", arguments: "" };
				pieces[at].id ??= call.id;
				pieces[at].name += call.function?.name ?? "";
				pieces[at].arguments += call.function?.arguments ?? "";
			}
		}
	};
	const reader = (answer.body as ReadableStream<Uint8Array>).getReader();
	const decoder = new TextDecoder();
	let rest = "";
	for (;;) {
		const { done, value } = await reader.read();
		rest += decoder.decode(value, { stream: !done });
		const lines = rest.split("\n");
		rest = done ? "" : (lines.pop() ?? "");
		for (const line of lines) take(line);
		if (done) break;
	}
	if (openai)
		message.tool_calls = Object.values(pieces).map((one) => ({
			id: one.id,
			function: { name: one.name, arguments: one.arguments },
		}));
	return message;
}

// the model asked once, in its dialect; tools left out on the last round, so it answers
async function chat(
	config: ReturnType<typeof settings>,
	messages: Message[],
	tools: Tool[],
	onToken: (text: string) => void = () => {},
): Promise<Reply> {
	const openai = config.url.endsWith("/v1");
	const described = tools.map((tool) => ({
		type: "function",
		function: {
			name: tool.name,
			description: tool.description ?? "",
			parameters: tool.inputSchema,
		},
	}));
	const body = openai
		? {
				model: config.model,
				stream: true,
				max_tokens: config.words,
				temperature: 0.6,
				...(tools.length ? { tools: described } : {}),
				messages: messages.map((one) =>
					one.role === "assistant"
						? {
								role: "assistant",
								content: one.content,
								...(one.calls.length
									? {
											tool_calls: one.calls.map((call) => ({
												id: call.id,
												type: "function",
												function: {
													name: call.name,
													arguments: JSON.stringify(call.arguments),
												},
											})),
										}
									: {}),
							}
						: one.role === "tool"
							? {
									role: "tool",
									tool_call_id: one.call.id,
									content: one.content,
								}
							: one,
				),
			}
		: {
				model: config.model,
				stream: true,
				think: true,
				options: {
					num_ctx: config.context,
					num_predict: config.words,
					temperature: 0.6, // as deepseek advises for R1
					repeat_penalty: 1.1, // a small model otherwise loops on one word
				},
				...(tools.length ? { tools: described } : {}),
				messages: messages.map((one) =>
					one.role === "assistant"
						? {
								role: "assistant",
								content: one.content,
								tool_calls: one.calls.map((call) => ({
									function: { name: call.name, arguments: call.arguments },
								})),
							}
						: one.role === "tool"
							? { role: "tool", tool_name: one.call.name, content: one.content }
							: one,
				),
			};
	const answer = await fetch(
		`${config.url}${openai ? "/chat/completions" : "/api/chat"}`,
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				...(config.key ? { authorization: `Bearer ${config.key}` } : {}),
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(1_800_000),
		},
	);
	if (!answer.ok)
		throw new Error(
			`the model at ${config.url} answered ${answer.status}: ${(await answer.text()).slice(0, 300)}`,
		);
	const message = await streamed(answer, openai, onToken);
	const raw = message.tool_calls;
	const content = message.content;
	if (!raw.length) {
		// deepseek-R1 distilled writes its calls as its own tokens in the text, which Ollama
		// leaves unparsed: <｜tool▁call▁begin｜>function<｜tool▁sep｜>name ```json {...}``` <｜tool▁call▁end｜>
		const written = [...content.matchAll(WRITTEN)];
		if (written.length)
			return {
				content: content
					.replace(WRITTEN, "")
					.replace(/<｜tool▁calls?▁(?:begin|end)｜>/g, "")
					.trim(),
				thinking: message.thinking,
				calls: written.map((one, i) => ({
					id: `written-${i}`,
					name: one[1],
					arguments: parsed(one[2]),
				})),
			};
	}
	return {
		content,
		thinking: message.thinking,
		calls: raw.map((call, i) => ({
			id: call.id ?? `call-${i}`,
			name: call.function.name,
			arguments:
				typeof call.function.arguments === "string"
					? JSON.parse(call.function.arguments || "{}")
					: ((call.function.arguments as Record<string, unknown>) ?? {}),
		})),
	};
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
	} = {},
): Promise<MastermindScope.Advice> {
	const { tools } = await client.listTools();
	const steps: MastermindScope.Advice["steps"] = [];
	const read = new Set<string>();
	const messages: Message[] = [{ role: "system", content: SYSTEM }];

	// one tool through MCP: its answer shortened; an act it opened remembered as read
	const call = async (one: Call) => {
		let text: string;
		let ok = true;
		try {
			const tool = tools.find((each) => each.name === one.name);
			if (tool) one.arguments = fitted(one.arguments, tool.inputSchema);
			const result = await client.callTool({
				name: one.name,
				arguments: one.arguments,
			});
			text = (result.content as { type: string; text?: string }[])
				.map((part) => part.text ?? "")
				.join("\n");
			ok = !result.isError;
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

	let rounds = 0;
	let last: Reply = { content: "", thinking: "", calls: [] };
	while (rounds < config.rounds) {
		rounds++;
		last = await chat(
			config,
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
	if (last.calls.length) {
		// it still wanted tools when the rounds ran out: once more, without them
		rounds++;
		last = await chat(config, messages, [], onToken);
	}
	const { answer, thinking } = split(last.content, last.thinking);
	return {
		question,
		answer,
		thinking,
		cited: [...new Set(answer.match(ELI) ?? [])].map((one) => ({
			ELI: one,
			read: read.has(one),
		})),
		steps,
		model: config.model,
		rounds,
	};
}
