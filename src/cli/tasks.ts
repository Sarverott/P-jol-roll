// The commands of the project as the launcher knows them: every task of every Taskfile, read
// from `task --list-all --json`, grouped by the Taskfile it comes from, and run by `task`.
// Declared once here, so the menu (src/tui/launcher/) and the REPL (src/cli/repl.ts) agree.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
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

// Where the output of every task run goes besides the terminal (the launcher's log file).
// A task is then run inside `script` of util-linux: in a terminal of its own, so it keeps its
// colours and questions, its output is recorded, and Ctrl+C reaches the task alone - the
// launcher (and the `task` that started it) stay, and the menu comes back. Without `script`
// (macOS, Windows) a task runs as it is and nothing of it is recorded.
let recorder: ((text: string) => void) | null = null;
export function recordInto(record: ((text: string) => void) | null) {
	recorder = record;
}

const SCRIPT = (() => {
	try {
		return /util-linux/.test(
			execFileSync("script", ["--version"], {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			}),
		);
	} catch {
		return false;
	}
})();

// one word for sh, quoted when it needs to be
export const quote = (word: string) =>
	/^[\w@%+=:,./-]+$/.test(word) ? word : `'${word.replaceAll("'", "'\\''")}'`;

// "gather -- 2026 --acts" -> task gather -- 2026 --acts; the exit code of task comes back.
// The terminal is given to the task cooked (the REPL holds it raw, and a raw terminal turns
// Ctrl+C into a plain character the task never takes for a signal), then given back.
export function runTask(name: string, args: string[] = []) {
	const raw = Boolean(process.stdin.isTTY && process.stdin.isRaw);
	if (raw) process.stdin.setRawMode(false);
	try {
		return runCooked(name, args);
	} finally {
		if (raw) process.stdin.setRawMode(true);
	}
}

function runCooked(name: string, args: string[]) {
	const command = [taskBinary(), name, ...(args.length ? ["--", ...args] : [])];
	if (!(recorder && SCRIPT)) {
		const [file, ...rest] = command;
		return spawnSync(file, rest, { cwd: ROOT, stdio: "inherit" }).status ?? 1;
	}
	const dir = mkdtempSync(join(tmpdir(), "p-jol-roll-task-"));
	const typescript = join(dir, "typescript");
	try {
		const result = spawnSync(
			"script",
			["-q", "-e", "-f", "-c", command.map(quote).join(" "), typescript],
			{ cwd: ROOT, stdio: "inherit" },
		);
		const text = existsSync(typescript) ? readFileSync(typescript, "utf8") : "";
		recorder(text.replace(/^Script (started|done) on .*\n?/gm, ""));
		return result.status ?? 1;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

// a line typed by a person split into words, "quoted words" kept whole
export function words(line: string) {
	return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
		(match) => match[1] ?? match[2] ?? match[3],
	);
}
