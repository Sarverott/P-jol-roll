import { sha256 } from "./sha256.js";

/*
The owner's idea (Q15): a text is not given a name in code; its own English is its key. A
text is normalized (spaces), its numbers become holes ("115 acts" -> "{0} acts"), and the
SHA-256 of that template is the hook a language pack answers. Pages, the launcher and the CLI
stay as they are written; a pack only maps hooks to texts. A pack entry is a string, or the
forms of a plural chosen by the first number: { one, few, many, other } (Intl.PluralRules).
*/

export type Entry = string | Partial<Record<Intl.LDMLPluralRule, string>>;
export type Pack = { locale: string; texts: Record<string, Entry> };

const NUMBER = /\d+(?:[.,]\d+)*/g;

export const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

// the template of a text and the numbers taken out of it
export function templateOf(text: string) {
	const numbers: string[] = [];
	const template = normalize(text).replace(NUMBER, (number) => {
		numbers.push(number);
		return `{${numbers.length - 1}}`;
	});
	return { template, numbers };
}

export const hookOf = (text: string) => sha256(templateOf(text).template);

// worth a hook: has letters, is not only a number or a mark
export const translatable = (text: string) => /\p{L}{2,}/u.test(text);

// the text in the pack's language, or undefined when the pack has no hook for it
export function translate(pack: Pack | undefined, text: string) {
	if (!pack || !translatable(text)) return undefined;
	const { template, numbers } = templateOf(text);
	const entry = pack.texts[sha256(template)];
	if (entry === undefined) return undefined;
	let form: string | undefined;
	if (typeof entry === "string") form = entry;
	else {
		const count = Number((numbers[0] ?? "0").replace(/[.,]/g, ""));
		const rule = new Intl.PluralRules(pack.locale).select(count);
		form = entry[rule] ?? entry.other ?? entry.many;
	}
	if (form === undefined) return undefined;
	const filled = form.replace(
		/\{(\d+)\}/g,
		(hole, at) => numbers[Number(at)] ?? hole,
	);
	// the spaces around the text in the page stay where they were
	const lead = text.match(/^\s*/)?.[0] ?? "";
	const trail = text.match(/\s*$/)?.[0] ?? "";
	return `${lead}${filled}${trail}`;
}

// for a terminal: the text itself when the pack has nothing for it
export const t = (pack: Pack | undefined, text: string) =>
	translate(pack, text) ?? text;
