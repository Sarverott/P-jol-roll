/*
Talking to a model (phase 30, apart from ask.ts in phase 31 so the roles of a team use it too):
Ollama's own /api/chat, or an OpenAI-like api when the address ends in /v1; the answer read as
a stream. A model of Ollama is asked for its thinking and given tools only when it can take
them (/api/show) - Ollama refuses both to a model without them.
*/

// what a model is asked with
export type Speaking = {
	url: string;
	model: string;
	key: string;
	context: number; // tokens of context (Ollama)
	words: number; // tokens it may write
};

const known = new Map<string, Promise<{ tools: boolean; thinking: boolean }>>();

// what a model of Ollama can take; both when it does not say (an older Ollama)
export function capabilities(url: string, model: string) {
	const key = `${url} ${model}`;
	if (!known.has(key))
		known.set(
			key,
			fetch(`${url}/api/show`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ model }),
			})
				.then(async (answer) => {
					const list: string[] | undefined = answer.ok
						? (await answer.json()).capabilities
						: undefined;
					return list
						? {
								tools: list.includes("tools"),
								thinking: list.includes("thinking"),
							}
						: { tools: true, thinking: true };
				})
				.catch(() => ({ tools: true, thinking: true })),
		);
	return known.get(key) as Promise<{ tools: boolean; thinking: boolean }>;
}

const WRITTEN =
	/<｜tool▁call▁begin｜>\s*function\s*<｜tool▁sep｜>\s*([\w-]+)\s*(?:```(?:json)?)?\s*(\{[\s\S]*?\})\s*(?:```)?\s*<｜tool▁call▁end｜>/g;

const parsed = (text: string): Record<string, unknown> => {
	try {
		return JSON.parse(text);
	} catch {
		return {};
	}
};

export type Call = {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
};
export type Message =
	| { role: "system" | "user"; content: string }
	| { role: "assistant"; content: string; calls: Call[] }
	| { role: "tool"; content: string; call: Call };
export type Reply = { content: string; thinking: string; calls: Call[] };
export type Tool = { name: string; description?: string; inputSchema: unknown };

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
export async function chat(
	config: Speaking,
	messages: Message[],
	tools: Tool[],
	onToken: (text: string) => void = () => {},
): Promise<Reply> {
	const openai = config.url.endsWith("/v1");
	const can = openai
		? { tools: true, thinking: true }
		: await capabilities(config.url, config.model);
	if (!can.tools) tools = [];
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
				...(can.thinking ? { think: true } : {}),
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
