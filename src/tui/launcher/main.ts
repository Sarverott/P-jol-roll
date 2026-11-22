// The launcher of P_JOL_ROLL: what bare `task` opens (phase 7, made easier in phase 22). Its
// menu is what a person wants to do - read the law, gather, process, share, the project - by
// the catalog of functions (src/core/catalog): a function asks what it takes one by one, a
// reading answers here, the rest runs its task. Every Taskfile with all its tasks stays one
// entry below, and the REPL knows both. Without a terminal (CI, a pipe) it lists the
// functions, as `task do`.
// Its own log, as every command's: logs/log-<Date.now()>-<mode>-launcher.log, with what was
// chosen, how each task ended and the output of each task (src/cli/tasks.ts records it).

import { repl } from "../../cli/repl.js";
import {
	groups,
	readTasks,
	recordInto,
	runTask,
	words,
} from "../../cli/tasks.js";
import { overview } from "../../core/catalog/help.js";
import { GROUPS, PROCEDURES } from "../../core/catalog/procedures.js";
import { shown, taskArgs } from "../../core/catalog/run.js";
import log, { logAppend, logRun } from "../../core/logging/setup.js";
import type {
	CatalogScope,
	LaunchingScope,
} from "../../core/vars/interfaces/index.js";
import { tr } from "../../i18n/terminal.js";
import { ask, askParams } from "./ask.js";
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

const back = () => ask(`\n${tr("Enter goes back to the menu ")}`);

const HELP = () =>
	[
		"",
		tr("How to use the launcher"),
		"",
		tr(
			"  ↑/↓ or k/j move, Enter chooses, a number jumps to its line, Esc or q goes back.",
		),
		tr(
			"  The first entries are what you may want to do. Choose one, then a function:",
		),
		tr(
			"  it asks what it takes one by one - Enter keeps the default in [brackets].",
		),
		tr(
			"  A function that reads the law answers right here, from what is gathered.",
		),
		tr(
			"  A function that gathers or changes files shows its task first, then runs it.",
		),
		tr("  Ctrl+C stops a running task and comes back here."),
		"",
		tr(
			'  "every task, by Taskfile" lists all tasks of the repository, as before.',
		),
		tr(
			"  The REPL takes the same functions as typed lines: acts MP 2025 query=podatek.",
		),
		tr("  The same from a shell: task do -- acts MP 2025 query=podatek."),
		"",
		tr(
			"  Start here: read the law → acts. Nothing gathered yet? gather from the sources → gather.",
		),
	].join("\n");

async function runProcedure(procedure: CatalogScope.Procedure) {
	console.log(`\n${procedure.name}: ${tr(procedure.title)}`);
	const values = await askParams(procedure.params);
	if (!values) return;
	note(`function ${procedure.name} ${JSON.stringify(values)}`);
	if (procedure.read) {
		try {
			console.log(`\n${shown(await procedure.read(values))}`);
		} catch (error) {
			console.log(`\n${(error as Error).message}`);
		}
		await back();
		return;
	}
	if (!procedure.task) return;
	const args = taskArgs(procedure, values);
	const line = `task ${procedure.task}${args.length ? ` -- ${args.join(" ")}` : ""}`;
	const sure = await select(
		`${line}${procedure.writes ? tr(" (it writes)") : ""}`,
		[
			{ label: tr("run it"), value: true },
			{ label: tr("back"), value: false },
		],
	);
	if (!sure) return;
	const code = run(procedure.task, args);
	await ask(
		`\n${tr("task {name} ended with {code} - Enter goes back to the menu ", { name: procedure.task, code })}`,
	);
}

async function functionsOf(group: string) {
	for (;;) {
		const chosen = await select(
			tr(GROUPS[group as keyof typeof GROUPS]),
			PROCEDURES.filter((one) => one.group === group).map((one) => ({
				label: one.name,
				hint: `${tr(one.title)}${one.writes ? " ✎" : ""}`,
				value: one,
			})),
		);
		if (!chosen) return;
		await runProcedure(chosen);
	}
}

// short words of each Taskfile, so a newcomer knows where to look
const ABOUT: Record<string, string> = {
	project: tr("gathering, processing, checks, versions"),
	src: tr("the api, MCP, website, desktop, app, extension"),
	docs: tr("the website of the project"),
	examples: tr("examples from Python: notebooks, marimo, pages"),
	devlog: tr("the plan: state, scrapnotes"),
	flow: tr("the routine: land, sync, close a phase"),
	resources: tr("moving data to and from Hugging Face"),
	unittesting: tr("the project on other systems, in containers"),
	github: tr("the repository on GitHub"),
	husky: tr("git hooks"),
	workflows: tr("durable runs"),
};

async function runTaskChosen(task: LaunchingScope.TaskEntry) {
	console.log(`\n${task.name}: ${tr(task.desc)}`);
	const line = await ask(tr("arguments after -- (Enter for none): "));
	const code = run(task.name, words(line));
	await ask(
		`\n${tr("task {name} ended with {code} - Enter goes back to the menu ", { name: task.name, code })}`,
	);
}

async function taskfiles() {
	for (;;) {
		const name = await select(
			tr("every task, by Taskfile"),
			groups(tasks).map((group) => ({
				label: group,
				hint: `${tr("{count} tasks", { count: tasks.filter((t) => t.group === group).length })} · ${ABOUT[group] ?? ""}`,
				value: group,
			})),
		);
		if (name === null) return;
		for (;;) {
			const own = tasks.filter((task) => task.group === name);
			const chosen = await select(
				`${name} - ${own[0]?.taskfile ?? ""}`,
				own.map((task) => ({
					label: task.name,
					hint: tr(task.desc),
					value: task,
				})),
			);
			if (!chosen) break;
			await runTaskChosen(chosen);
		}
	}
}

async function menu() {
	for (;;) {
		const chosen = await select(tr("P_JOL_ROLL - what do you want to do?"), [
			...Object.entries(GROUPS).map(([group, title]) => ({
				label: tr(title),
				hint: tr("{count} functions", {
					count: PROCEDURES.filter((one) => one.group === group).length,
				}),
				value: `group:${group}`,
			})),
			{
				label: tr("first launch on this machine"),
				hint: "task init",
				value: "init",
			},
			{
				label: tr("every task, by Taskfile"),
				hint: tr("{count} tasks", { count: tasks.length }),
				value: "tasks",
			},
			{
				label: "REPL",
				hint: tr("type functions and tasks as commands, Tab completes"),
				value: "repl",
			},
			{ label: tr("how to use this"), hint: "?", value: "help" },
			{ label: tr("quit"), value: "quit" },
		]);
		if (chosen === null || chosen === "quit") return;
		if (chosen === "help") {
			console.log(HELP());
			await back();
		} else if (chosen === "init") {
			run("init");
			await back();
		} else if (chosen === "tasks") await taskfiles();
		else if (chosen === "repl") {
			note("REPL");
			if (!(await repl(tasks, run))) return;
		} else await functionsOf(chosen.slice("group:".length));
	}
}

if (process.stdin.isTTY && process.stdout.isTTY) await menu();
else console.log(overview());
