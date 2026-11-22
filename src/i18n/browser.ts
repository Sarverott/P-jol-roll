/// <reference types="vite/client" />

import indexFile from "../../resources/locales/.index.json" with {
	type: "json",
};
import { apply, collect, follow } from "./dom.js";
import { hookOf, type Pack } from "./hooks.js";

/*
The language of a page in a browser (phase 16): the packs of resources/locales/, the one
chosen by ?lang=, then by the last choice of this browser, then by the browser's languages,
else the default (EN-US, the English as written). Only the chosen pack is loaded, before the
page is shown, and laid over it (dom.ts); a choice later swaps it without a reload.
*/

type Listed = { code: string; locale: string; name: string; file: string };
type Index = { default: string; packs: Listed[] };

// imported by name: a glob of Vite skips files that start with a dot
const index = indexFile as Index;
const files = import.meta.glob<{ texts: Pack["texts"] }>(
	"../../resources/locales/*.json",
	{ import: "default" },
);
const KEPT = "p-jol-roll-language";

// the packs that are made (a file exists), the default first
export const languages = index.packs.filter(
	(one) =>
		one.code === index.default ||
		Object.keys(files).some((path) => path.endsWith(`/${one.file}`)),
);

export function chosen(): string {
	const asked = new URLSearchParams(location.search).get("lang")?.toUpperCase();
	let kept: string | null = null;
	try {
		kept = localStorage.getItem(KEPT);
	} catch {}
	const wanted = [
		asked,
		kept,
		...navigator.languages.map((tag) => tag.toUpperCase()),
	].filter(Boolean) as string[];
	for (const tag of wanted) {
		const found =
			languages.find((one) => one.code === tag) ??
			languages.find((one) => one.code.startsWith(`${tag.split("-")[0]}-`));
		if (found) return found.code;
	}
	return index.default;
}

async function packOf(code: string): Promise<Pack | undefined> {
	const listed = languages.find((one) => one.code === code);
	if (!listed || code === index.default) return undefined;
	const load = Object.entries(files).find(([path]) =>
		path.endsWith(`/${listed.file}`),
	)?.[1];
	return load
		? { locale: listed.locale, texts: (await load()).texts }
		: undefined;
}

let current: Pack | undefined;
let followed = false;

// the page in a language: laid over root, kept over what is rendered later, remembered
export async function use(code: string, root: Node = document.body) {
	current = await packOf(code);
	document.documentElement.lang =
		languages.find((one) => one.code === code)?.locale ?? "en-US";
	try {
		localStorage.setItem(KEPT, code);
	} catch {}
	apply(root, current);
	if (!followed) follow(root, () => current);
	followed = true;
}

// for task i18n:collect, which reads a page's English through the page itself
(globalThis as { __i18n?: unknown }).__i18n = { collect, hookOf, use };
