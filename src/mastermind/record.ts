import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RESOURCES_DIR } from "../core/resources/store.js";
import type { MastermindScope } from "../core/vars/interfaces/index.js";
import { families } from "./team.js";

/*
Every conversation of the mastermind kept (phase 31, the owner's order: "collect as many
results as we can"), so the answers of models and families can be compared:

  resources/conversations/<family>/<instance>/<UNIXUSAT>-<the question's first words>.json

the family of resources/configs/mastermind/families.yaml, the instance the model with its size
or tag ("gemma4-12b"), a file per session in the order they came. Each holds the question, the
answer, the reasoning, the acts cited and the tools called, and the whole exchange with the
model - what it was given and what the tools answered. Never pushed anywhere by itself.
MASTERMIND_KEEP=0 keeps nothing.
*/

export const CONVERSATIONS_DIR = join(RESOURCES_DIR, "conversations");

// "SpeakLeash/bielik-11b-v2.2-instruct:Q4_K_M" -> "bielik-11b-v2.2-instruct"
const bare = (model: string) =>
	(model.split("/").pop() ?? model).split(":")[0].toLowerCase();

export function familyOf(model: string): string {
	const name = bare(model);
	for (const [family, names] of Object.entries(families()))
		if (names.some((one) => name.startsWith(one.toLowerCase()))) return family;
	return name.match(/^[a-z]+/)?.[0] ?? "other";
}

// "gemma4:12b" -> "gemma4-12b", "deepseek-r1" -> "deepseek-r1-latest"
export function instanceOf(model: string): string {
	const [name, tag = "latest"] = model.split(":");
	return `${name}-${tag}`.replace(/[^\w.-]+/g, "-");
}

const slug = (text: string) =>
	text
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/ł/g, "l")
		.replace(/Ł/g, "L")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 48) || "question";

export function keep(
	advice: MastermindScope.Advice,
	exchange: unknown[],
	about: { url: string; started: number; settings: Record<string, unknown> },
): string {
	if (process.env.MASTERMIND_KEEP === "0") return "";
	const family = familyOf(advice.model);
	const instance = instanceOf(advice.model);
	const folder = join(CONVERSATIONS_DIR, family, instance);
	const path = join(folder, `${about.started}-${slug(advice.question)}.json`);
	const { record: _itself, ...said } = advice;
	try {
		mkdirSync(folder, { recursive: true });
		writeFileSync(
			path,
			`${JSON.stringify(
				{
					UNIXUSAT: about.started,
					date: new Date(about.started).toISOString(),
					seconds: Math.round((Date.now() - about.started) / 100) / 10,
					family,
					instance,
					url: about.url,
					settings: about.settings,
					...said,
					exchange,
				},
				null,
				1,
			)}\n`,
		);
	} catch {
		return ""; // a host that cannot write there still answers
	}
	return path;
}
