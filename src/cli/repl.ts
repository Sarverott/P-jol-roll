// The REPL of the launcher: a prompt where every function of the catalog (src/core/catalog)
// and every task is a command, with Tab completion.
//   p-jol-roll> acts MP 2025 query=podatek           a reading, answered here
//   p-jol-roll> help acts                            what a function takes
//   p-jol-roll> gather 2026 --acts limit=5           a function that writes: its task
//   p-jol-roll> gather -- 2026 --acts --limit 5      a task with its own arguments, as before
//   p-jol-roll> functions | list docs | help | menu | exit
import { createInterface } from "node:readline/promises";
import { described, overview } from "../core/catalog/help.js";
import { PROCEDURES, procedure } from "../core/catalog/procedures.js";
import { shown, taskArgs, valuesOf } from "../core/catalog/run.js";
import type { LaunchingScope } from "../core/vars/interfaces/index.js";
import { tr } from "../i18n/terminal.js";
import { groups, runTask, words } from "./tasks.js";

const BUILTIN = ["help", "functions", "list", "menu", "exit"];

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
export async function interpret(
	tasks: LaunchingScope.TaskEntry[],
	line: string,
	run: (name: string, args: string[]) => number = runTask,
) {
	const [first = "", ...rest] = words(line.trim());
	if (!first) return { leave: false };
	if (first === "exit" || first === "quit") return { leave: true };
	if (first === "menu") return { leave: true, menu: true };
	if (first === "help") {
		const found = rest[0] ? procedure(rest[0]) : undefined;
		console.log(
			found
				? described(found)
				: `${tr('Every function is a command: "acts MP 2025 query=podatek" reads, "help acts" says what it takes, "functions" names them all.')}\n${tr('Every task is a command too: "gather -- 2026 --limit 5" runs task gather -- 2026 --limit 5; "list" names the tasks, "list docs" those of one Taskfile.')}\n${tr('Tab completes; "menu" goes back to the menu, "exit" leaves.')}`,
		);
		return { leave: false };
	}
	if (first === "functions") {
		console.log(overview());
		return { leave: false };
	}
	// a function of the catalog, unless "--" hands the words to the task as they are
	const found = procedure(first);
	if (found && rest[0] !== "--") {
		try {
			const values = valuesOf(found, rest);
			if (found.read) console.log(shown(await found.read(values)));
			else if (found.task) {
				const code = run(found.task, taskArgs(found, values));
				if (code)
					console.log(
						tr("task {name} ended with {code}", { name: found.task, code }),
					);
			}
		} catch (error) {
			console.log(`${(error as Error).message}\n${described(found)}`);
		}
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
	const names = [
		...new Set([
			...BUILTIN,
			...PROCEDURES.map((one) => one.name),
			...tasks.map((task) => task.name),
		]),
	];
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
	console.log(
		tr(
			'P_JOL_ROLL - every function and task is a command; "help", "functions", Tab, "exit"',
		),
	);
	try {
		for (;;) {
			const line = await rl
				.question("p-jol-roll> ", { signal: stop.signal })
				.catch(() => "menu");
			const { leave, menu } = await interpret(tasks, line, run);
			if (leave) return Boolean(menu);
		}
	} finally {
		rl.close();
	}
}
