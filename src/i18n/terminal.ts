import { type Pack, t } from "./hooks.js";
import { packFor, terminalLanguage } from "./node.js";

/*
The words of a terminal (the launcher, the REPL, the lists of tasks) in the language of the
terminal: P_JOL_ROLL_LANG, else LANG, else English (node.ts). tr("task {name} ended with
{code}", { name, code }) - the English is the hook as everywhere (hooks.ts); named places in
braces are filled after the pack is laid over, so a translation keeps them where its language
wants them. task i18n:collect finds every tr("...") of src/ by itself.
*/

let pack: Pack | undefined | null = null;

export function tr(text: string, values: Record<string, string | number> = {}) {
	if (pack === null) pack = packFor(terminalLanguage());
	return t(pack, text).replace(/\{([a-z]\w*)\}/g, (place, name) =>
		name in values ? String(values[name]) : place,
	);
}
