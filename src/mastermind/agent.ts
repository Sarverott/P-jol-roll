import { spawn, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { logRun } from "../core/logging/setup.js";
import type { MastermindScope } from "../core/vars/interfaces/index.js";
import { keep } from "./record.js";

/*
The executive agent (phase 33, planned since Q18): a small qwen doing what a person gives it,
in opencode, reading the law through the MCP server of src/mcp. Not a chat: a task - "find the
acts of 1919 about schools and write their list to resources/agent/schools.md".
  task agent -- "what to do"                     on this machine, the host's Ollama
  task agent:container -- "what to do"           in the agents' shell (compose profile agentic),
                                                 Ollama of the profile llms beside it
Its settings are resources/configs/agentic-shell/opencode/ (opencode.json, executive.md):
the model of Ollama, the MCP server, and what it may do - write only, never run a command or
fetch a page; executive.md keeps its writing in resources/agent/. They are copied on each run
into its own config directory, so opencode reads neither the person's global settings nor
their sessions, and they into none of its: XDG_CONFIG_HOME and XDG_DATA_HOME are its own,
under resources/.containerdatavol/agent/.
  AGENT_MODEL        a model of opencode.json, qwen3:8b by default
  AGENT_OLLAMA_URL   Ollama's OpenAI-like api, http://127.0.0.1:11434/v1 by default
Every run is kept as a conversation (record.ts): the task, its answer, the tools it called and
every event opencode said.
*/

logRun("agent");
const ROOT = resolve(import.meta.dirname, "..", "..");
const HOME = join(ROOT, "resources", ".containerdatavol", "agent");
const model = process.env.AGENT_MODEL || "qwen3:8b";
const url = process.env.AGENT_OLLAMA_URL || "http://127.0.0.1:11434/v1";
const task = process.argv.slice(2).join(" ").trim();
if (!task) {
	console.error('a task: task agent -- "what to do"');
	process.exit(1);
}

mkdirSync(join(ROOT, "resources", "agent"), { recursive: true });

/*
The engine. "own" (the default): qwen through the mastermind's own rounds (ask.ts), calling the
MCP tools directly, with one tool of its own, write_note - the reliable way. "opencode": opencode
2 as its host, as planned; its Code Mode hands MCP tools over as code, and in some runs it does
not find the server's namespace at all ("Unknown tool 'p-jol-roll.act_text'", phase 33) - kept,
to be tried again with the next opencode.
*/
if ((process.env.AGENT_ENGINE || "own") !== "opencode") {
	const { connect } = await import("../mcp/client.js");
	const { ask, settings } = await import("./ask.js");
	const OUT = join(ROOT, "resources", "agent");
	const { noteTool } = await import("./note.js");
	const writeNote = noteTool(OUT);
	const client = await connect();
	try {
		const advice = await ask(task, client, {
			system: readFileSync(
				join(ROOT, "resources", "configs", "mastermind", "executive.md"),
				"utf8",
			),
			local: [writeNote],
			onStep: (step) =>
				console.error(
					`  ${step.ok ? "·" : "!"} ${step.tool} ${JSON.stringify(step.arguments).slice(0, 160)}`,
				),
			config: {
				...settings(),
				team: undefined,
				model,
				url: url.replace(/\/v1\/?$/, ""),
				rounds: Number(process.env.AGENT_ROUNDS) || 8,
			},
		});
		console.log(`\n${advice.answer || "(no answer)"}\n`);
		for (const one of advice.cited)
			console.log(
				`  [${one.ELI}] ${one.read ? "read through the tools" : "NOT OPENED - named without reading"}`,
			);
		console.log(
			`\n${model}, ${advice.steps.length} tool call(s). Kept: ${advice.record || "no"}. Not (formally) legal advices.`,
		);
	} finally {
		await client.close();
	}
	process.exit(0);
}

mkdirSync(join(HOME, "data"), { recursive: true });
const config = join(HOME, "config", "opencode");
cpSync(
	join(ROOT, "resources", "configs", "agentic-shell", "opencode"),
	config,
	{
		recursive: true,
	},
);

/*
Ollama's OpenAI-like api gives a model the context it was made with - a few thousand tokens -
and opencode's prompt, the AGENTS.md it reads and the tools' descriptions are longer: cut from
the start, the model never sees its tools (phase 33). So the agent runs a model of its own,
"<name>-agent:<tag>": the same weights with AGENT_CONTEXT tokens of context (24576), made in
Ollama once - only a manifest, nothing downloaded - and named in the copy of opencode.json.
*/
const context = Number(process.env.AGENT_CONTEXT) || 24576;
const [name, tag = "latest"] = model.split(":");
const agentModel = `${name}-agent:${tag}`;
const ollama = url.replace(/\/v1\/?$/, "");
const made = await fetch(`${ollama}/api/create`, {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({
		model: agentModel,
		from: model,
		parameters: { num_ctx: context },
		stream: false,
	}),
}).catch((error: Error) => error);
if (made instanceof Error || !made.ok)
	console.error(
		`the agent's model ${agentModel} not made in ${ollama} (${made instanceof Error ? made.message : made.status}) - is ${model} pulled there?`,
	);
const settingsPath = join(config, "opencode.json");
const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
settings.provider.ollama.models[agentModel] = {
	name: `${model}, ${context} tokens of context`,
	tools: true,
};
settings.agent.executive.model = `ollama/${agentModel}`;
writeFileSync(settingsPath, `${JSON.stringify(settings, null, "\t")}\n`);
// opencode 2 runs a background service for every session of the machine: its own server instead
const standalone = spawnSync("opencode", ["run", "--help"], {
	encoding: "utf8",
}).stdout?.includes("--standalone");

type Event = {
	type: string;
	part?: {
		type?: string;
		text?: string;
		tool?: string;
		state?: { status?: string; input?: Record<string, unknown> };
	};
};

const started = Date.now();
const events: Event[] = [];
const child = spawn(
	"opencode",
	[
		"run",
		...(standalone ? ["--standalone"] : []),
		"--format",
		"json",
		"--agent",
		"executive",
		"--model",
		`ollama/${agentModel}`,
		"--title",
		task.slice(0, 60),
		task,
	],
	{
		cwd: ROOT,
		env: {
			...process.env,
			XDG_CONFIG_HOME: join(HOME, "config"),
			XDG_DATA_HOME: join(HOME, "data"),
			AGENT_OLLAMA_URL: url,
		},
		stdio: ["ignore", "pipe", "inherit"],
	},
);
let rest = "";
child.stdout.on("data", (chunk: Buffer) => {
	rest += chunk.toString();
	const lines = rest.split("\n");
	rest = lines.pop() ?? "";
	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const event = JSON.parse(line) as Event;
			events.push(event);
			const part = event.part;
			if (part?.type === "tool" && part.state?.status === "completed")
				console.error(
					`  · ${part.tool} ${JSON.stringify(part.state.input ?? {})}`,
				);
		} catch {}
	}
});
const code: number = await new Promise((done) => child.on("close", done));

const ELI = /\b(?:DU|MP)\/\d{4}\/\d+\b/g;
const OPENING = new Set(["act", "act_text", "act_references"]);
const parts = events.map((one) => one.part ?? {});
const answer = parts
	.filter((one) => one.type === "text")
	.map((one) => one.text ?? "")
	.join("\n\n")
	.trim();
const thinking = parts
	.filter((one) => one.type === "reasoning")
	.map((one) => one.text ?? "")
	.join("\n\n")
	.trim();
/*
The tools it called. opencode 2 gives an MCP server's tools through Code Mode: the model writes
code for "execute", in which each call is tools["p-jol-roll"].<tool>({...}) - so the calls are
read out of that code. An act is read when its ELI went to act, act_text or act_references; it
is found when a tool's answer named it.
*/
type State = {
	status?: string;
	input?: Record<string, unknown>;
	output?: unknown;
};
const CALL = /tools\[["'`]p-jol-roll["'`]\]\.(\w+)\(\s*(\{[^}]*\})?/g;
const steps: MastermindScope.Advice["steps"] = [];
const read = new Set<string>();
const found = new Set<string>();
for (const part of parts) {
	if (part.type !== "tool") continue;
	const state = (part.state ?? {}) as State;
	if (state.status === "running" || state.status === "pending") continue;
	const output = String(state.output ?? "");
	const ok =
		state.status === "completed" && !/^(Unknown tool|Error)/.test(output);
	for (const one of output.match(ELI) ?? []) found.add(one);
	const code = String(state.input?.code ?? "");
	const calls = [...code.matchAll(CALL)];
	if (!calls.length)
		steps.push({
			tool: String(part.tool ?? "").replace(/^p-jol-roll_/, ""),
			arguments: state.input ?? {},
			ok,
		});
	for (const [, tool, written] of calls) {
		const eli = written?.match(/eli\s*:\s*["'`]((?:DU|MP)\/\d{4}\/\d+)/)?.[1];
		steps.push({ tool, arguments: eli ? { eli, code } : { code }, ok });
		if (ok && eli && OPENING.has(tool)) read.add(eli);
	}
}
const advice: MastermindScope.Advice = {
	question: task,
	answer,
	thinking,
	cited: [...new Set(answer.match(ELI) ?? [])].map((one) => ({
		ELI: one,
		read: read.has(one),
	})),
	steps,
	model: agentModel,
	team: "",
	original: "",
	guard: null,
	rounds: events.filter((one) => one.type === "step_start").length,
	record: "",
};
advice.record = keep(advice, events, {
	url,
	started,
	settings: { agent: "executive", by: "opencode", model, context, exit: code },
});
console.log(`\n${answer || "(no answer)"}\n`);
for (const one of advice.cited)
	console.log(
		`  [${one.ELI}] ${one.read ? "read through the tools" : found.has(one.ELI) ? "found by a tool, not opened" : "NOT FROM THE TOOLS - named from memory"}`,
	);
console.log(
	`\n${model} in opencode, ${advice.steps.length} tool call(s), exit ${code}. Kept: ${advice.record || "no"}. Not (formally) legal advices.`,
);
process.exit(code);
