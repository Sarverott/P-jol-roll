import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { FatalError } from "workflow";
import type { WorkflowScope } from "../../core/vars/interfaces/index.js";

/*
Steps of durable runs: each one is a command of the gatherer, run the same way
"task ..." runs it, in its own process. A step that fails is tried again by
the workflow runtime (3 times); every command here can be repeated safely,
because the gatherer takes only what is missing and the tables are written whole.
*/

const KEEP = 40; // lines of output kept in the event log of the run

// the server is started from the root of the repository ("task workflows:serve"),
// so the gatherer and its tsx are found from there
const MAIN = "src/core/main.ts";

function run(...command: string[]): Promise<WorkflowScope.CommandResult> {
	if (!existsSync(MAIN))
		throw new FatalError(
			`${MAIN} is not in ${process.cwd()} - start the server from the root of the repository`,
		);
	const started = Date.now();
	return new Promise((done, fail) => {
		const child = spawn(
			process.execPath,
			["--import", "tsx", MAIN, ...command],
			{ stdio: ["ignore", "pipe", "pipe"] },
		);
		const lines: string[] = [];
		const keep = (chunk: Buffer) => {
			process.stdout.write(chunk);
			lines.push(...chunk.toString().split("\n").filter(Boolean));
			lines.splice(0, Math.max(0, lines.length - KEEP));
		};
		child.stdout.on("data", keep);
		child.stderr.on("data", keep);
		child.on("error", fail);
		child.on("exit", (code) => {
			const result = {
				command,
				seconds: Math.round((Date.now() - started) / 1000),
				output: lines.join("\n"),
			};
			if (code === 0) done(result);
			else
				fail(
					new Error(
						`${command.join(" ")} ended with ${code}\n${result.output}`,
					),
				);
		});
	});
}

// listings, details and references of acts changed since the day, or since the previous run
export async function gatherChanges(since: string) {
	"use step";
	return run("gather", "--since", since);
}

export async function seal() {
	"use step";
	return run("seal");
}

export async function compile() {
	"use step";
	return run("compile");
}

export async function text() {
	"use step";
	return run("text");
}

// what differs between a local side and huggingface - asks the hub, changes nothing
export async function plan(repository: string) {
	"use step";
	return run("hub", "plan", repository);
}

// sends - only reached after a person said yes to the run
export async function push(repository: string) {
	"use step";
	return run("hub", "push", repository);
}
