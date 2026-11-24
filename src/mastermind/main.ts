import { logRun } from "../core/logging/setup.js";
import { connect } from "../mcp/client.js";
import { ask, settings } from "./ask.js";

/*
A question to the law mastermind from a terminal (task mastermind:ask -- "..."):
  tsx src/mastermind/main.ts "Jaki jest wiek emerytalny?"        the MCP server over stdio here
  MCP_URL=http://127.0.0.1:8080/mcp tsx src/mastermind/main.ts "..."    the tools of a running api
  --json   the whole answer as JSON (with the reasoning and the tools called)
The model: settings() of ask.ts (MASTERMIND_URL, MASTERMIND_MODEL - the host's Ollama and
deepseek-r1:8b by default).
*/

logRun("mastermind");
const json = process.argv.includes("--json");
const question = process.argv
	.slice(2)
	.filter((one) => one !== "--json")
	.join(" ")
	.trim();
if (!question) {
	console.error('a question: task mastermind:ask -- "..."');
	process.exit(1);
}
const config = settings();
console.error(`mastermind: ${config.model} at ${config.url}`);
const client = await connect();
try {
	const advice = await ask(question, client, {
		config,
		// a dot per piece written, so a long thinking is seen to go on
		onToken: () => process.stderr.write("."),
		onStep: (step) =>
			console.error(
				`  ${step.ok ? "·" : "!"} ${step.tool} ${JSON.stringify(step.arguments)}`,
			),
	});
	if (json) console.log(JSON.stringify(advice, null, 1));
	else {
		console.log(`\n${advice.answer}\n`);
		for (const one of advice.cited)
			console.log(
				`  [${one.ELI}] ${one.read ? "read through the tools" : "NOT READ - the model named it from memory"}`,
			);
		console.log(
			`\n${advice.model}, ${advice.rounds} round(s), ${advice.steps.length} tool call(s). Not legal advice.`,
		);
	}
} finally {
	await client.close();
}
