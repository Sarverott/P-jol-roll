// The REPL of the launcher: a prompt where every task is a command, with Tab completion.
//   p-jol-roll> gather -- 2026 --acts --limit 5      runs task gather -- 2026 --acts --limit 5
//   p-jol-roll> list docs                            the tasks of one Taskfile
//   p-jol-roll> help | menu | exit
import { createInterface } from "node:readline/promises";
import type { LaunchingScope } from "../core/vars/interfaces/index.js";
import { tr } from "../i18n/terminal.js";
import { groups, runTask, words } from "./tasks.js";

const BUILTIN = ["help", "list", "menu", "exit"];

export function listing(tasks: LaunchingScope.TaskEntry[], group?: string) {
	const lines: string[] = [];
	for (const name of groups(tasks)) {
		if (group && name !== group) continue;
		lines.push(`\n${name}`);
		for (const task of tasks.filter((t) => t.group === name))
			lines.push(`  ${task.name.padEnd(26)} ${tr(task.desc)}`);
	}
	return lines.join("\n");
}

// what the REPL does with one line; "menu" and "exit" are told to the caller
export function interpret(
	tasks: LaunchingScope.TaskEntry[],
	line: string,
	run: (name: string, args: string[]) => number = runTask,
) {
	const [first = "", ...rest] = words(line.trim());
	if (!first) return { leave: false };
	if (first === "exit" || first === "quit") return { leave: true };
	if (first === "menu") return { leave: true, menu: true };
	if (first === "help") {
		console.log(
			`${tr('Every task is a command: "gather -- 2026 --limit 5" runs task gather -- 2026 --limit 5.')}\n${tr('"list" names them all, "list docs" those of one Taskfile; Tab completes; "menu" goes back to the menu, "exit" leaves.')}`,
		);
		return { leave: false };
	}
	if (first === "list") {
		console.log(listing(tasks, rest[0]));
		return { leave: false };
	}
	if (!tasks.some((task) => task.name === first)) {
		console.log(tr('no task "{name}" - "list" names them', { name: first }));
		return { leave: false };
	}
	const args = rest[0] === "--" ? rest.slice(1) : rest;
	const code = run(first, args);
	if (code)
		console.log(tr("task {name} ended with {code}", { name: first, code }));
	return { leave: false };
}

export async function repl(
	tasks: LaunchingScope.TaskEntry[],
	run: (name: string, args: string[]) => number = runTask,
) {
	const names = [...BUILTIN, ...tasks.map((task) => task.name)];
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
		completer: (line: string) => {
			const hits = names.filter((name) => name.startsWith(line.trim()));
			return [hits.length ? hits : names, line] as [string[], string];
		},
	});
	// Ctrl+C at the prompt goes back to the menu
	const stop = new AbortController();
	rl.on("SIGINT", () => stop.abort());
	console.log(tr('P_JOL_ROLL - every task is a command; "help", Tab, "exit"'));
	try {
		for (;;) {
			const line = await rl
				.question("p-jol-roll> ", { signal: stop.signal })
				.catch(() => "menu");
			const { leave, menu } = interpret(tasks, line, run);
			if (leave) return Boolean(menu);
		}
	} finally {
		rl.close();
	}
}
