import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { logRun } from "../core/logging/setup.js";
import { connect } from "../mcp/client.js";
import { ask, settings } from "./ask.js";
import { teams } from "./team.js";

/*
Every team asked the same questions (phase 31): task mastermind:compare [-- gemma bielik ...],
the questions of resources/configs/mastermind/questions.yaml (or QUESTIONS=<file>), each answer
kept as a conversation (record.ts) and a line said here - how long, how many acts cited and how
many of them read, the language, the guard. A team whose models are not in the Ollama is
skipped and named, nothing is pulled from here.
*/

logRun("mastermind-compare");
const base = settings();
const path =
	process.env.QUESTIONS ??
	join("resources", "configs", "mastermind", "questions.yaml");
const questions: string[] = existsSync(path)
	? (parse(readFileSync(path, "utf8"))?.questions ?? [])
	: [];
if (!questions.length) {
	console.error(`no questions in ${path}`);
	process.exit(1);
}
const wanted = process.argv.slice(2);
const chosen = teams().filter(
	(one) => !wanted.length || wanted.includes(one.name),
);

// the models this Ollama holds, so a team without its models is skipped, not pulled
const held = new Set<string>(
	await fetch(`${base.url}/api/tags`)
		.then(async (answer) =>
			((await answer.json()).models ?? []).map(
				(one: { name: string }) => one.name,
			),
		)
		.catch(() => []),
);
const has = (model: string) =>
	held.size === 0 || held.has(model) || held.has(`${model}:latest`);

const client = await connect();
try {
	for (const team of chosen) {
		const roles = [team.answer, team.tools, team.translate, team.guard].filter(
			(one): one is string => Boolean(one),
		);
		const missing = roles.filter((one) => !has(one));
		if (!team.answer || missing.length) {
			console.log(
				`${team.name}: skipped - not in this Ollama: ${missing.join(", ")}`,
			);
			continue;
		}
		console.log(`\n${team.name}: ${roles.join(", ")}`);
		for (const question of questions) {
			const started = Date.now();
			try {
				const advice = await ask(question, client, {
					config: { ...base, team, model: team.answer },
				});
				const read = advice.cited.filter((one) => one.read).length;
				console.log(
					`  ${Math.round((Date.now() - started) / 1000)}s  cited ${advice.cited.length} (read ${read})  ${advice.original ? "translated" : advice.answer && !/[ąęłńśźż]/i.test(advice.answer) ? "not Polish" : "Polish"}${advice.guard ? `  guard: ${advice.guard.verdict}` : ""}  ${question.slice(0, 60)}`,
				);
			} catch (error) {
				console.log(
					`  failed: ${(error as Error).message.slice(0, 160)}  ${question.slice(0, 60)}`,
				);
			}
		}
	}
} finally {
	await client.close();
}
console.log(
	"\nkept in resources/conversations/ - task resources:push -- conversations sends them",
);
