import {
	hookOf,
	type Pack,
	templateOf,
	translatable,
	translate,
} from "./hooks.js";

/*
A language pack laid over a page that stays as it was written: every text node and the
readable attributes are found, hooked by the SHA-256 of their English (hooks.ts) and given the
pack's text. The English is remembered per node, so a page goes back to it or to another
language. What is data - titles and texts of acts - is marked translate="no" (the attribute of
HTML for that) and is never touched; so is code. A MutationObserver lays the pack over what a
framework renders later: Vue patches a node -> it holds English again -> it is translated again.
*/

const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"];
const SKIPPED = new Set([
	// NOTE: nope, instead of look across all and exclude chosen elements include only SPAN, BUTTON, P and other items that contains inside important for us elements... sounds smarter?
	"SCRIPT",
	"STYLE",
	"CODE",
	"PRE",
	"TEXTAREA",
	"NOSCRIPT",
]); // NOTE: for even more immersive integration we can just siply mark stuff we want to consider as i18n translating items by special set of classes

// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-slot"))
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-placeholder"))
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-title"))
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-alt"))

// NOTE:  cool, right?

const english = new WeakMap<Node, string>();
const englishAttributes = new WeakMap<Element, Record<string, string>>();
// what apply() itself wrote: a change to anything else came from the page
const written = new WeakMap<Node, string>();
const writtenAttributes = new WeakMap<Element, Record<string, string>>();

function kept(node: Node | null): boolean {
	for (let at = node; at; at = at.parentNode) {
		if (at.nodeType !== 1) continue;
		const element = at as Element;
		if (SKIPPED.has(element.tagName)) return true;
		if (element.getAttribute("translate") === "no") return true;
	}
	return false;
}

function under(root: Node) {
	const texts: Text[] = [];
	const found: Element[] = [];
	const walk = (node: Node) => {
		if (node.nodeType === 3) texts.push(node as Text);
		else {
			if (node.nodeType === 1) found.push(node as Element);
			for (const child of node.childNodes) walk(child);
		}
	};
	walk(root);
	return {
		texts: texts.filter((node) => !kept(node.parentNode)),
		elements: found.filter((element) => !kept(element)),
	};
}

// what a page says in English: hook -> template, for the pack of the default language
export function collect(root: Node, into: Record<string, string> = {}) {
	const add = (text: string) => {
		if (translatable(text)) into[hookOf(text)] = templateOf(text).template;
	};
	const { texts, elements } = under(root);
	for (const node of texts) add(english.get(node) ?? node.nodeValue ?? "");
	for (const element of elements)
		for (const name of ATTRIBUTES) {
			const value =
				englishAttributes.get(element)?.[name] ?? element.getAttribute(name);
			if (value) add(value);
		}
	return into;
}

// the pack laid over everything under root; no pack (or the default) gives the English back
export function apply(root: Node, pack: Pack | undefined) {
	const { texts, elements } = under(root);
	for (const node of texts) {
		const source = english.get(node) ?? node.nodeValue ?? "";
		const text = translate(pack, source);
		if (text !== undefined) english.set(node, source);
		const wanted = text ?? source;
		written.set(node, wanted);
		if (node.nodeValue !== wanted) node.nodeValue = wanted;
	}
	for (const element of elements)
		for (const name of ATTRIBUTES) {
			const remembered = englishAttributes.get(element) ?? {};
			const source = remembered[name] ?? element.getAttribute(name);
			if (!source) continue;
			const text = translate(pack, source);
			if (text !== undefined)
				englishAttributes.set(element, { ...remembered, [name]: source });
			const wanted = text ?? source;
			writtenAttributes.set(element, {
				...writtenAttributes.get(element),
				[name]: wanted,
			});
			if (element.getAttribute(name) !== wanted)
				element.setAttribute(name, wanted);
		}
}

// the pack kept over what changes later; returns the way to stop
export function follow(
	root: Node,
	pack: () => Pack | undefined,
	Observer = (globalThis as { MutationObserver?: typeof MutationObserver })
		.MutationObserver,
) {
	if (!Observer) return () => {};
	const observer = new Observer((changes) => {
		for (const change of changes) {
			const target = change.target;
			if (change.type === "characterData") {
				if (target.nodeValue === written.get(target)) continue;
				english.delete(target);
				apply(target, pack());
			} else if (change.type === "attributes") {
				const element = target as Element;
				const name = change.attributeName ?? "";
				if (
					element.getAttribute(name) === writtenAttributes.get(element)?.[name]
				)
					continue;
				const remembered = englishAttributes.get(element);
				if (remembered) delete remembered[name];
				apply(element, pack());
			} else for (const node of change.addedNodes) apply(node, pack());
		}
		observer.takeRecords();
	});
	observer.observe(root, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeFilter: ATTRIBUTES,
	});
	return () => observer.disconnect();
}
