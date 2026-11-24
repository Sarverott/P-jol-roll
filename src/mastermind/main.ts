import { logRun } from "../core/logging/setup.js";
import { connect } from "../mcp/client.js";
import { ask, settings } from "./ask.js";
import { hardSettings, strategy } from "./strategy.js";

/*
A question to the law mastermind from a terminal (task mastermind:ask -- "..."):
  tsx src/mastermind/main.ts "Jaki jest wiek emerytalny?"        the MCP server over stdio here
  MCP_URL=http://127.0.0.1:8080/mcp tsx src/mastermind/main.ts "..."    the tools of a running api
  --json   the whole answer as JSON (with the reasoning and the tools called)
  --escalate  the advanced strategy (strategy.ts, phase 34): a weak answer goes on to the deepseek
              hosted by Hugging Face, on HF_TOKEN
  --hard      straight to that deepseek
The model: settings() of ask.ts (MASTERMIND_URL, MASTERMIND_MODEL - the host's Ollama and
deepseek-r1:8b by default).
*/

logRun("mastermind");
const FLAGS = ["--json", "--escalate", "--hard"];
const json = process.argv.includes("--json");
const mode = process.argv.includes("--hard")
	? "hard"
	: process.argv.includes("--escalate")
		? "escalate"
		: undefined;
const question = process.argv
	.slice(2)
	.filter((one) => !FLAGS.includes(one))
	.join(" ")
	.trim();
if (!question) {
	console.error('a question: task mastermind:ask -- "..."');
	process.exit(1);
}
const config = settings();
const hard = hardSettings();
console.error(
	mode === "hard"
		? `mastermind: ${hard.model} at ${hard.url}`
		: `mastermind: ${config.model} at ${config.url}${mode ? `, then ${hard.model} when its answer is weak` : ""}`,
);
const client = await connect();
try {
	const options: Parameters<typeof ask>[2] = {
		config,
		// a dot per piece written, so a long thinking is seen to go on
		onToken: () => process.stderr.write("."),
		onStep: (step) =>
			console.error(
				`  ${step.ok ? "·" : "!"} ${step.tool} ${JSON.stringify(step.arguments)}`,
			),
	};
	// without a mode the small one alone: its answer never goes on
	const advice = mode
		? await strategy(question, client, { ...options, mode, hard })
		: await ask(question, client, options);
	if (json) console.log(JSON.stringify(advice, null, 1));
	else {
		console.log(`\n${advice.answer}\n`);
		for (const one of advice.cited)
			console.log(
				`  [${one.ELI}] ${one.read ? "read through the tools" : "NOT READ - the model named it from memory"}`,
			);
		if (advice.escalated)
			console.log(
				`  ${advice.escalated.from} answered first, not enough (${advice.escalated.why.join("; ")}) - kept: ${advice.escalated.record || "no"}`,
			);
		if (advice.original)
			console.log(
				`  translated by ${config.team?.translate} from what ${advice.model} said in another language`,
			);
		if (advice.guard)
			console.log(`  guard ${advice.guard.by}: ${advice.guard.verdict}`);
		console.log(
			`\n${advice.team ? `team ${advice.team}: ` : ""}${advice.model}, ${advice.rounds} round(s), ${advice.steps.length} tool call(s). Kept: ${advice.record || "no"}. Not (formally) legal advices.`,
		);
	}
} finally {
	await client.close();
}
