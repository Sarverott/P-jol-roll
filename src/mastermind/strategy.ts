import type { Client } from "@modelcontextprotocol/client";
import type { MastermindScope } from "../core/vars/interfaces/index.js";
import { ask, settings } from "./ask.js";

/*
The advanced strategy (phase 34, Q18): "several instances of deepseek-R1 at once: small ones in
Ollama on the host, the advanced strategy on a deepseek hosted by Hugging Face". A small model of
the host answers first; a hard question goes on to the large deepseek, through Inference
Providers (OpenAI-like, https://router.huggingface.co/v1), with the same MCP tools.
  escalate   the small one first; its answer goes on when it is weak (weak() says why)
  hard       straight to the large one
The large one is given the small one's answer to check, never to trust, and reads the acts itself.
  HARD_URL     https://router.huggingface.co/v1
  HARD_MODEL   deepseek-ai/DeepSeek-R1-0528 (novita, deepinfra, featherless-ai serve it)
  HARD_KEY     the token it is paid by: HF_TOKEN of .env when unset - the owner's own, so only a
               question the owner asks spends it; on the space the visitor's (src/openapi/ask.ts)
*/

export const hardSettings = () => ({
	url: (process.env.HARD_URL || "https://router.huggingface.co/v1").replace(
		/\/+$/,
		"",
	),
	model: process.env.HARD_MODEL || "deepseek-ai/DeepSeek-R1-0528",
	key: process.env.HARD_KEY || process.env.HF_TOKEN || "",
});

// why an answer is not enough: nothing said, nothing cited, or cited without being read
export function weak(advice: MastermindScope.Advice): string[] {
	if (!advice.answer.trim()) return ["it said nothing"];
	const why: string[] = [];
	if (!advice.cited.length) why.push("it cited no act");
	const unread = advice.cited.filter((one) => !one.read).map((one) => one.ELI);
	if (unread.length) why.push(`it cited ${unread.join(", ")} without reading`);
	return why;
}

type Options = NonNullable<Parameters<typeof ask>[2]> & {
	mode?: "escalate" | "hard";
	hard?: ReturnType<typeof hardSettings>;
};

export async function strategy(
	question: string,
	client: Client,
	{
		mode = "escalate",
		hard = hardSettings(),
		config = settings(),
		...options
	}: Options = {},
): Promise<MastermindScope.Advice> {
	const first =
		mode === "hard"
			? null
			: await ask(question, client, { ...options, config });
	const why = first ? weak(first) : ["asked as a hard question"];
	if (first && !why.length) return first;
	if (!hard.key)
		throw new Error(
			`the hard question needs a token for ${hard.url}: HF_TOKEN (or HARD_KEY)${first ? ` - the small one's answer was weak: ${why.join("; ")}` : ""}`,
		);
	const given = first
		? [
				`A smaller model (${first.model}) answered first, and its answer is not enough (${why.join("; ")}). Check it against the acts; do not trust it:\n\n${first.answer}`,
			]
		: [];
	return ask(question, client, {
		...options,
		given,
		escalated: first
			? { from: first.model, why, answer: first.answer, record: first.record }
			: undefined,
		config: { ...config, team: undefined, ...hard },
	});
}
