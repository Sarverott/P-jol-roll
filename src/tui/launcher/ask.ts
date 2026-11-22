// A line asked in the terminal; Ctrl+C at it answers nothing. And the parameters of a function
// of the catalog asked one by one: a choice or a flag as a menu, a word with its default shown.
import { createInterface } from "node:readline/promises";
import type { CatalogScope } from "../../core/vars/interfaces/index.js";
import type { CatalogScope as CatalogTypes } from "../../core/vars/types/index.js";
import { tr } from "../../i18n/terminal.js";
import { select } from "./select.js";

export async function ask(question: string) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const stop = new AbortController();
	rl.on("SIGINT", () => stop.abort());
	try {
		return await rl.question(question, { signal: stop.signal });
	} catch {
		console.log();
		return "";
	} finally {
		rl.close();
	}
}

// null when the person went back (Esc at a menu)
export async function askParams(
	params: CatalogScope.Parameter[],
): Promise<CatalogTypes.Values | null> {
	const values: CatalogTypes.Values = {};
	for (const param of params) {
		if (param.kind === "choice" && param.choices) {
			const chosen = await select(
				tr(param.title),
				param.choices.map((choice) => ({
					label: choice || tr("(none)"),
					hint: choice === param.default ? tr("default") : undefined,
					value: choice,
				})),
			);
			if (chosen === null) return null;
			values[param.name] = chosen;
		} else if (param.kind === "flag") {
			const chosen = await select(tr(param.title), [
				{ label: tr("no"), value: false },
				{ label: tr("yes"), value: true },
			]);
			if (chosen === null) return null;
			values[param.name] = chosen;
		} else {
			const by =
				param.default !== undefined && param.default !== ""
					? ` [${param.default}]`
					: "";
			const several = param.many ? ` (${tr("several, with spaces")})` : "";
			for (;;) {
				const line = (await ask(`${tr(param.title)}${several}${by}: `)).trim();
				if (!line && param.required) {
					console.log(tr("this one is needed"));
					continue;
				}
				if (!line) values[param.name] = param.default;
				else if (param.many) values[param.name] = line.split(/\s+/);
				else if (param.kind === "number" && Number.isNaN(Number(line))) {
					console.log(tr("a number, please"));
					continue;
				} else
					values[param.name] = param.kind === "number" ? Number(line) : line;
				break;
			}
		}
	}
	return values;
}
