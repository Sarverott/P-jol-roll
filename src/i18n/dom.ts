import {
	hookOf,
	type Pack,
	templateOf,
	translatable,
	translate,
} from "./hooks.js";

/*
A language pack laid over a page that stays as it was written: what the page marks as its
interface is found, hooked by the SHA-256 of its English (hooks.ts) and given the pack's text.
The English is remembered per node, so a page goes back to it or to another language.
A MutationObserver lays the pack over what a framework renders later: Vue patches a node ->
it holds English again -> it is translated again.

Only what is marked is translated (phase 21), by classes:
  i18n-texts-slot          every text under it and the readable attributes of what is under it
  i18n-texts-placeholder   the placeholder of this element; -title, -alt, -label (aria-label) alike
Inside a slot, what is data - titles and texts of acts - is marked translate="no" (the attribute
of HTML for that) and never touched; so is code. The documentation is all interface: its builder
marks the body as one slot (src/devtools/docs-i18n.ts, i18n.ts).
*/

// NOTE: nope, instead of look across all and exclude chosen elements include only SPAN, BUTTON, P and other items that contains inside important for us elements... sounds smarter?
// NOTE: for even more immersive integration we can just siply mark stuff we want to consider as i18n translating items by special set of classes
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-slot"))
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-placeholder"))
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-title"))
// NOTE:  Array.from(document.querySelectorAll(".i18n-texts-alt"))
// NOTE:  cool, right?
// ANSWER: cool, and done - the classes are the only way in now, a list of tags would still have
// taken a <span> of data; i18n-texts-label added for aria-label. The few tags below stay out
// even inside a slot, as a block of code in the documentation is code

export const SLOT = "i18n-texts-slot";
// a readable attribute and the class that marks it on one element
const ATTRIBUTES: Record<string, string> = {
	placeholder: "i18n-texts-placeholder",
	title: "i18n-texts-title",
	alt: "i18n-texts-alt",
	"aria-label": "i18n-texts-label",
};
const NAMES = Object.keys(ATTRIBUTES);
const SKIPPED = new Set([
	"SCRIPT",
	"STYLE",
	"CODE",
	"PRE",
	"TEXTAREA",
	"NOSCRIPT",
]);

const english = new WeakMap<Node, string>();
const englishAttributes = new WeakMap<Element, Record<string, string>>();
// what apply() itself wrote: a change to anything else came from the page
const written = new WeakMap<Node, string>();
const writtenAttributes = new WeakMap<Element, Record<string, string>>();

const classes = (element: Element) =>
	(element.getAttribute("class") ?? "").split(/\s+/);

// left as it is: data (translate="no") or code, here or above
function kept(node: Node | null): boolean {
	for (let at = node; at; at = at.parentNode) {
		if (at.nodeType !== 1) continue;
		const element = at as Element;
		if (SKIPPED.has(element.tagName)) return true;
		if (element.getAttribute("translate") === "no") return true;
	}
	return false;
}

// under a slot: this element or one above it is marked i18n-texts-slot
function slotted(node: Node | null): boolean {
	for (let at = node; at; at = at.parentNode)
		if (at.nodeType === 1 && classes(at as Element).includes(SLOT)) return true;
	return false;
}

// the readable attributes of an element that are to be translated
const marked = (element: Element) =>
	slotted(element)
		? NAMES
		: NAMES.filter((name) => classes(element).includes(ATTRIBUTES[name]));

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
		texts: texts.filter(
			(node) => slotted(node.parentNode) && !kept(node.parentNode),
		),
		elements: found
			.filter((element) => !kept(element))
			.map((element) => ({ element, names: marked(element) }))
			.filter(({ names }) => names.length),
	};
}

// what a page says in English: hook -> template, for the pack of the default language
export function collect(root: Node, into: Record<string, string> = {}) {
	const add = (text: string) => {
		if (translatable(text)) into[hookOf(text)] = templateOf(text).template;
	};
	const { texts, elements } = under(root);
	for (const node of texts) add(english.get(node) ?? node.nodeValue ?? "");
	for (const { element, names } of elements)
		for (const name of names) {
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
	for (const { element, names } of elements)
		for (const name of names) {
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
		attributeFilter: NAMES,
	});
	return () => observer.disconnect();
}
