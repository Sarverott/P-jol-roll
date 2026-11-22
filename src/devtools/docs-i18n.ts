import {
	cpSync,
	globSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { parseHTML } from "linkedom";
import { apply } from "../i18n/dom.js";
import type { Pack } from "../i18n/hooks.js";
import {
	index,
	languages,
	packFor,
	DOCS_TRANSLATED as TRANSLATED,
} from "../i18n/node.js";

/*
The documentation in every language of resources/locales/, when the website is built (phase
16): search engines read a translation only when it is in the page. The built MkDocs site is
copied into <docs>/<language>/ per pack, and the pack is laid over the pages of TRANSLATED by
the same dom.ts the browser uses. The changelog and the devlog keep the owner's words word for
word, so they are copied as they are. Every page gets a list of languages in its header.
Usage: tsx src/devtools/docs-i18n.ts site/docs
*/

const folderOf = (code: string) => code.toLowerCase();

function menu(path: string, here: string, depth: number, document: Document) {
	const up = "../".repeat(depth);
	const nav = document.createElement("nav");
	nav.setAttribute("class", "p-languages");
	nav.setAttribute("translate", "no");
	nav.setAttribute("aria-label", "languages");
	const page = path.replace(/index\.html$/, "");
	for (const one of languages()) {
		const link = document.createElement("a");
		const folder = one.code === index().default ? "" : `${folderOf(one.code)}/`;
		link.setAttribute("href", `${up}${folder}${page}`);
		link.setAttribute("hreflang", one.locale);
		if (one.code === here) link.setAttribute("aria-current", "true");
		link.textContent = one.code.split("-")[0].toUpperCase();
		nav.appendChild(link);
	}
	return nav;
}

function lay(
	file: string,
	path: string,
	code: string,
	pack: Pack | undefined,
	depth: number,
) {
	const { document } = parseHTML(readFileSync(file, "utf8"));
	const listed = languages().find((one) => one.code === code);
	if (pack && TRANSLATED.some((pattern) => pattern.test(path)))
		apply(document.body as unknown as Node, pack);
	document.documentElement.setAttribute("lang", listed?.locale ?? "en-US");
	// a page is laid over once: a menu or style left by an earlier run goes first
	for (const old of document.querySelectorAll(
		".p-languages, style[data-p-languages]",
	))
		old.remove();
	const header = document.querySelector(".md-header__inner");
	header?.insertBefore(
		menu(path, code, depth, document as unknown as Document),
		document.querySelector(".md-header__inner .md-search") ?? null,
	);
	const style = document.createElement("style");
	style.setAttribute("data-p-languages", "");
	style.textContent =
		".p-languages{display:flex;gap:.4rem;margin:0 .6rem;font-size:.7rem}.p-languages a{color:inherit;opacity:.7}.p-languages a[aria-current]{opacity:1;font-weight:700}";
	document.head.appendChild(style);
	writeFileSync(file, document.toString());
}

const docs = process.argv[2] ?? "site/docs";
const folders = languages()
	.filter((one) => one.code !== index().default)
	.map((one) => folderOf(one.code));
const pages = globSync("**/*.html", { cwd: docs }).filter(
	(path) => !folders.some((folder) => path.startsWith(`${folder}/`)),
);

for (const one of languages()) {
	const english = one.code === index().default;
	const root = english ? docs : join(docs, folderOf(one.code));
	if (!english) {
		rmSync(root, { recursive: true, force: true });
		mkdirSync(root, { recursive: true });
		for (const entry of globSync("*", { cwd: docs }))
			if (!folders.includes(entry))
				cpSync(join(docs, entry), join(root, entry), { recursive: true });
	}
	const pack = packFor(one.code);
	for (const path of pages) {
		const depth = path.split("/").length - 1 + (english ? 0 : 1);
		lay(join(root, path), path, one.code, pack, depth);
	}
	console.log(
		`${relative(".", root) || "."}: ${pages.length} pages, ${english ? "the English" : one.code}`,
	);
}
