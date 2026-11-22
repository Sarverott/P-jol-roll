import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import type { CatalogScope } from "../vars/interfaces/index.js";
import type { CatalogScope as CatalogTypes } from "../vars/types/index.js";
import { taskArgs } from "./run.js";

/*
Writing functions started by a host on this machine (Q19, answered in phase 25: "add it with
that command switch flag argument"): the api started with --allow-writing, the desktop app.
A job is the function's own task, the same as in a terminal, so the source is asked as politely
as ever (two at a time, the project's User-Agent). One job at a time; its output is kept in
memory, the newest LINES lines, for the viewer to follow. --yes answers the task's own prompt
(a push, everything of Sejm): the person said "yes" in the viewer before the job was asked for.
*/

type Job = CatalogScope.Job;

export const LINES = 400;

const jobs: Job[] = [];
let counter = 0;

const TASK_BIN = existsSync("node_modules/.bin/task")
	? "node_modules/.bin/task"
	: "task";

export const running = () => jobs.find((job) => job.state === "running");

export const list = () => jobs.map(({ lines, ...job }) => job);

export const get = (id: number) => jobs.find((job) => job.id === id);

export function start(
	procedure: CatalogScope.Procedure,
	values: CatalogTypes.Values,
	onChange: (job: Job) => void = () => {},
): Job {
	if (!procedure.writes || !procedure.task)
		throw new Error(`${procedure.name} is not a writing function`);
	const busy = running();
	if (busy) throw new Error(`${busy.name} runs now - one job at a time`);
	const args = taskArgs(procedure, values);
	const job: Job = {
		id: ++counter,
		name: procedure.name,
		task: procedure.task,
		args,
		state: "running",
		started: new Date().toISOString(),
		lines: [],
	};
	jobs.push(job);
	if (jobs.length > 20) jobs.shift();

	const child = spawn(TASK_BIN, ["--yes", procedure.task, "--", ...args], {
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env, FORCE_COLOR: "0" },
	});
	let rest = "";
	const take = (chunk: Buffer) => {
		const lines = (rest + chunk.toString()).split(/\r?\n/);
		rest = lines.pop() ?? "";
		job.lines.push(...lines);
		if (job.lines.length > LINES) job.lines.splice(0, job.lines.length - LINES);
		onChange(job);
	};
	child.stdout.on("data", take);
	child.stderr.on("data", take);
	const end = (code: number | null, error?: Error) => {
		if (job.state !== "running") return;
		if (rest) job.lines.push(rest);
		if (error) job.lines.push(`could not start ${TASK_BIN}: ${error.message}`);
		job.state = code === 0 ? "done" : "failed";
		job.code = code;
		job.ended = new Date().toISOString();
		onChange(job);
	};
	child.on("error", (error) => end(null, error));
	child.on("close", (code) => end(code));
	return job;
}
