import { spawnSync } from "node:child_process";
import { ROOT } from "../paths/at.js";
import { described, overview } from "./help.js";
import { procedure } from "./procedures.js";
import { shown, taskArgs, valuesOf } from "./run.js";

/*
Every function of the catalog from a terminal (phase 22):
  task do                              every function, by what it is for
  task do -- help acts                 what one takes
  task do -- acts MP 2025 query=podatek     a reading, answered here
  task do -- gather 2026 --acts limit=5     a writing function: its task
*/

const [name = "", ...words] = process.argv.slice(2);

if (!name) console.log(overview());
else if (name === "help") {
	const found = words[0] ? procedure(words[0]) : undefined;
	console.log(found ? described(found) : overview());
} else {
	const found = procedure(name);
	if (!found) {
		console.error(`no function "${name}" - "task do" names them`);
		process.exit(2);
	}
	try {
		const values = valuesOf(found, words);
		if (found.read) console.log(shown(await found.read(values)));
		else if (found.task) {
			const args = taskArgs(found, values);
			const binary = `${ROOT}node_modules/.bin/task`;
			const run = spawnSync(
				binary,
				[found.task, ...(args.length ? ["--", ...args] : [])],
				{ cwd: ROOT, stdio: "inherit" },
			);
			process.exitCode = run.status ?? 1;
		}
	} catch (error) {
		console.error((error as Error).message);
		console.error(described(found));
		process.exitCode = 2;
	}
}
