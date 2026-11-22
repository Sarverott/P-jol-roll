// The commands of the project as the launcher knows them: every task of every Taskfile, read
// from `task --list-all --json`, grouped by the Taskfile it comes from, and run by `task`.
// Declared once here, so the menu (src/tui/launcher/) and the REPL (src/cli/repl.ts) agree.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { LaunchingScope } from "../core/vars/interfaces/index.js";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// the task binary of node_modules (npm install brings it), else the one on PATH
export function taskBinary() {
	const local = `${ROOT}node_modules/.bin/task`;
	return existsSync(local) ? local : "task";
}

// "docs/Taskfile.yml" -> docs, "Taskfile.yml" -> project, "src/Taskfile.yml" -> src
export function groupOf(taskfile: string) {
	const dir = taskfile.replace(/\/?Taskfile\.ya?ml$/, "");
	if (!dir) return "project";
	return (
		dir
			.split("/")
			.filter((part) => part && !part.startsWith("."))
			.pop() ?? dir.replace(/^\./, "")
	);
}

export function entriesOf(
	json: {
		tasks: { name: string; desc?: string; location: { taskfile: string } }[];
	},
	root = ROOT,
): LaunchingScope.TaskEntry[] {
	return json.tasks.map((task) => {
		const taskfile = relative(root, task.location.taskfile) || "Taskfile.yml";
		// a task of an included Taskfile is grouped by its namespace (flow:land -> flow),
		// one of a flattened include (src/Taskfile.yml) by the Taskfile's directory
		const main = taskfile === "Taskfile.yml";
		const space = task.name.includes(":") ? task.name.split(":")[0] : "";
		return {
			name: task.name,
			desc: task.desc ?? "",
			taskfile,
			group: main ? "project" : space || groupOf(taskfile),
		};
	});
}

export function readTasks(): LaunchingScope.TaskEntry[] {
	const out = execFileSync(taskBinary(), ["--list-all", "--json"], {
		cwd: ROOT,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
	});
	// default is the launcher itself
	return entriesOf(JSON.parse(out)).filter((task) => task.name !== "default");
}

// the groups in a steady order: the project first, then by name
export function groups(tasks: LaunchingScope.TaskEntry[]) {
	const names = [...new Set(tasks.map((task) => task.group))];
	return names.sort((a, b) =>
		a === "project" ? -1 : b === "project" ? 1 : a.localeCompare(b),
	);
}

// "gather -- 2026 --acts" -> task gather -- 2026 --acts; the exit code of task comes back
export function runTask(name: string, args: string[] = []) {
	const result = spawnSync(
		taskBinary(),
		args.length ? [name, "--", ...args] : [name],
		{ cwd: ROOT, stdio: "inherit" },
	);
	return result.status ?? 1;
}

// a line typed by a person split into words, "quoted words" kept whole
export function words(line: string) {
	return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
		(match) => match[1] ?? match[2] ?? match[3],
	);
}
