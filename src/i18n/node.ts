import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pack } from "./hooks.js";

// the packs of resources/locales/ outside a browser: the website's build, the launcher, the CLI
export const LOCALES = fileURLToPath(
	new URL("../../resources/locales/", import.meta.url),
);

export type Listed = {
	code: string;
	locale: string;
	name: string;
	file: string;
};
export type Index = { default: string; packs: Listed[] };

export const index = (): Index =>
	JSON.parse(readFileSync(join(LOCALES, ".index.json"), "utf8"));

// the packs that exist, the default first
export const languages = () => {
	const { packs } = index();
	return packs.filter((one) => existsSync(join(LOCALES, one.file)));
};

export function packFor(code: string): Pack | undefined {
	const listed = languages().find((one) => one.code === code.toUpperCase());
	if (!listed || listed.code === index().default) return undefined;
	const { texts } = JSON.parse(
		readFileSync(join(LOCALES, listed.file), "utf8"),
	);
	return { locale: listed.locale, texts };
}

// a terminal's language: P_JOL_ROLL_LANG, else LANG ("pl_PL.UTF-8" -> PL-PL), else the default
export function terminalLanguage(env = process.env): string {
	const wanted = (env.P_JOL_ROLL_LANG || env.LANG || "")
		.split(".")[0]
		.replace("_", "-")
		.toUpperCase();
	const found = languages().find(
		(one) =>
			one.code === wanted || one.code.startsWith(`${wanted.split("-")[0]}-`),
	);
	return found?.code ?? index().default;
}

// pages of the documentation that are translated; the changelog and the devlog keep the
// owner's words word for word, so they stay as they are in every language
export const DOCS_TRANSLATED = [/^index\.html$/, /^guides\//, /^glossary\//];
