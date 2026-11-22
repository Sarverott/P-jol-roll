// The launcher of P_JOL_ROLL: what bare `task` opens (phase 7 of the devlog). A menu of the
// ways to run the project - every Taskfile is a group of its tasks - and a REPL where every
// task is a command. Without a terminal (CI, a pipe) it only lists the tasks, as `task help`.
// Its own log, as every command's: logs/log-<Date.now()>-<mode>-launcher.log, with what was
// chosen, how each task ended and the output of each task (src/cli/tasks.ts records it).

import { createInterface } from "node:readline/promises";
import { listing, repl } from "../../cli/repl.js";
import {
	groups,
	readTasks,
	recordInto,
	runTask,
	words,
} from "../../cli/tasks.js";
import log, { logAppend, logRun } from "../../core/logging/setup.js";
import type { LaunchingScope } from "../../core/vars/interfaces/index.js";
import { select } from "./select.js";

logRun("launcher");
const note = (text: string) =>
	logAppend(`${new Date().toISOString()} launcher: ${text}`);
recordInto((text) => logAppend(text));
// Ctrl+C meant for a task never ends the launcher: written down, and the menu goes on
process.on("SIGINT", () => note("interrupted (Ctrl+C)"));
note("started");
process.on("exit", (code) => note(`left with ${code}`));

const tasks = readTasks();

// a task run from the menu or the REPL, written down before and after
function run(name: string, args: string[] = []) {
	note(`task ${[name, ...(args.length ? ["--", ...args] : [])].join(" ")}`);
	const code = runTask(name, args);
	note(`task ${name} ended with ${code}`);
	if (code === 130) log.warning(`task ${name} was interrupted`);
	return code;
}
// short words of each group, so a newcomer knows where to look
const ABOUT: Record<string, string> = {
	project: "gathering, processing, checks, versions",
	src: "the api, MCP, website, desktop, app, extension",
	docs: "the website of the project",
	devlog: "the plan: state, scrapnotes",
	flow: "the routine: land, sync, close a phase",
	resources: "moving data to and from Hugging Face",
	unittesting: "the project on other systems, in containers",
	github: "the repository on GitHub",
	husky: "git hooks",
	workflows: "durable runs",
};

// a question; Ctrl+C at it answers nothing
async function ask(question: string) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const stop = new AbortController();
	rl.on("SIGINT", () => stop.abort());
	try {
		return await rl.question(question, { signal: stop.signal });
	} catch {
		console.log();
		return "";
	} finally {
		rl.close();
	}
}

async function runChosen(task: LaunchingScope.TaskEntry) {
	console.log(`\n${task.name}: ${task.desc}`);
	const line = await ask("arguments after -- (Enter for none): ");
	const code = run(task.name, words(line));
	await ask(
		`\ntask ${task.name} ended with ${code} - Enter goes back to the menu `,
	);
}

async function group(name: string) {
	for (;;) {
		const own = tasks.filter((task) => task.group === name);
		const chosen = await select(
			`${name} - ${own[0]?.taskfile ?? ""}`,
			own.map((task) => ({ label: task.name, hint: task.desc, value: task })),
		);
		if (!chosen) return;
		await runChosen(chosen);
	}
}

async function menu() {
	for (;;) {
		const chosen = await select("P_JOL_ROLL - how to run it", [
			{
				label: "first launch on this machine",
				hint: "task init",
				value: "init",
			},
			...groups(tasks).map((name) => ({
				label: name,
				hint: `${tasks.filter((t) => t.group === name).length} tasks · ${ABOUT[name] ?? ""}`,
				value: `group:${name}`,
			})),
			{
				label: "REPL",
				hint: "type tasks as commands, Tab completes",
				value: "repl",
			},
			{ label: "quit", value: "quit" },
		]);
		if (chosen === null || chosen === "quit") return;
		if (chosen === "init") {
			run("init");
			await ask("\nEnter goes back to the menu ");
		} else if (chosen === "repl") {
			note("REPL");
			if (!(await repl(tasks, run))) return;
		} else await group(chosen.slice("group:".length));
	}
}

if (process.stdin.isTTY && process.stdout.isTTY) await menu();
else console.log(listing(tasks));
