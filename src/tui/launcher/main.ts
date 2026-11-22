// The launcher of P_JOL_ROLL: what bare `task` opens (phase 7 of the devlog). A menu of the
// ways to run the project - every Taskfile is a group of its tasks - and a REPL where every
// task is a command. Without a terminal (CI, a pipe) it only lists the tasks, as `task help`.
import { createInterface } from "node:readline/promises";
import { listing, repl } from "../../cli/repl.js";
import { groups, readTasks, runTask, words } from "../../cli/tasks.js";
import type { LaunchingScope } from "../../core/vars/interfaces/index.js";
import { select } from "./select.js";

const tasks = readTasks();

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

async function ask(question: string) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		return await rl.question(question);
	} finally {
		rl.close();
	}
}

async function runChosen(task: LaunchingScope.TaskEntry) {
	console.log(`\n${task.name}: ${task.desc}`);
	const line = await ask("arguments after -- (Enter for none): ");
	const code = runTask(task.name, words(line));
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
			runTask("init");
			await ask("\nEnter goes back to the menu ");
		} else if (chosen === "repl") {
			if (!(await repl(tasks))) return;
		} else await group(chosen.slice("group:".length));
	}
}

if (process.stdin.isTTY && process.stdout.isTTY) await menu();
else console.log(listing(tasks));
