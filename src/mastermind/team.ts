import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { chat, type Speaking } from "./model.js";

/*
The families of models and their teams (phase 31, the owner's order: "all models from one
familly acts as one team"), from resources/configs/mastermind/families.yaml. A team gives the
mastermind more than one voice: one answers, one calls the tools, one translates an answer
given in another language, one guards. What each said is kept with the conversation.
*/

export type Team = {
	name: string;
	answer?: string;
	tools?: string;
	translate?: string;
	guard?: string;
	embed?: string;
};

let read:
	| {
			families: Record<string, string[]>;
			teams: Record<string, Omit<Team, "name">>;
	  }
	| undefined;
const loaded = () => {
	if (!read) {
		const path = join("resources", "configs", "mastermind", "families.yaml");
		const data = existsSync(path) ? parse(readFileSync(path, "utf8")) : {};
		read = { families: data?.families ?? {}, teams: data?.teams ?? {} };
	}
	return read;
};

export const families = () => loaded().families;
export const teams = (): Team[] =>
	Object.entries(loaded().teams).map(([name, roles]) => ({ name, ...roles }));
export const teamOf = (name?: string) =>
	name ? teams().find((one) => one.name === name) : undefined;

// Polish or not, roughly: its letters, or enough of its commonest words
const WORDS = new Set(
	"i w z na się nie jest do że od o oraz to jak czy przez dla który która które był była było są lub".split(
		" ",
	),
);
export function polish(text: string): boolean {
	if (/[ąęłńśźżĄĘŁŃŚŹŻ]/.test(text)) return true;
	const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
	return (
		words.length > 0 &&
		words.filter((one) => WORDS.has(one)).length / words.length > 0.08
	);
}

// an answer turned into Polish by the team's translator, in the prompt translategemma was taught
export async function translated(
	speaking: Speaking,
	model: string,
	text: string,
): Promise<string> {
	const prompt = `You are a professional English (en) to Polish (pl) translator. Your goal is to accurately convey the meaning and nuances of the original English text while adhering to Polish grammar, vocabulary, and cultural sensitivities.
Produce only the Polish translation, without any additional explanations or commentary. Please translate the following English text into Polish:


${text}`;
	const reply = await chat(
		{ ...speaking, model },
		[{ role: "user", content: prompt }],
		[],
	);
	return reply.content.trim();
}

// the answer judged by the team's guard (shieldgemma: "Yes" - it breaks a policy, "No" - not)
export async function guarded(
	speaking: Speaking,
	model: string,
	question: string,
	answer: string,
): Promise<{ by: string; verdict: string; said: string }> {
	const reply = await chat(
		{ ...speaking, model, words: 256 },
		[
			{ role: "user", content: question },
			{ role: "assistant", content: answer, calls: [] },
		],
		[],
	);
	const said = reply.content.trim();
	const verdict = /^\W*yes\b/i.test(said)
		? "yes"
		: /^\W*no\b/i.test(said)
			? "no"
			: "unclear";
	return { by: model, verdict, said };
}
