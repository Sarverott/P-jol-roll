import type { CatalogScope } from "../vars/interfaces/index.js";
import type { CatalogScope as CatalogTypes } from "../vars/types/index.js";

/*
What every way does with a function of the catalog: the words of a line made into values (the
REPL, "task do"), the values made into the arguments of its task, a reading answered and shown
in a terminal, and the catalog as data for the api and the viewer.
*/

type Procedure = CatalogScope.Procedure;
type Values = CatalogTypes.Values;

// the defaults of a function's parameters
export function defaults(procedure: Procedure): Values {
	return Object.fromEntries(
		procedure.params
			.filter((param) => param.default !== undefined)
			.map((param) => [param.name, param.default]),
	);
}

function wordAs(param: CatalogScope.Parameter, word: string) {
	if (param.kind === "number") return Number(word);
	if (param.kind === "flag") return !/^(no|false|0)$/i.test(word);
	return word;
}

// words of a line: name=value, --flag, or words in the order of the parameters
//   acts MP 2025 query=podatek     act DU/2026/1     gather 2026 --acts limit=5
export function valuesOf(procedure: Procedure, words: string[]): Values {
	const values = defaults(procedure);
	const inOrder = procedure.params.filter((param) => param.kind !== "flag");
	let next = 0;
	for (const word of words) {
		const named =
			/^--?([\w-]+)(?:=(.*))?$/.exec(word) ?? /^([\w-]+)=(.*)$/.exec(word);
		const param = named
			? procedure.params.find(
					(one) => one.name === named[1] || one.option === named[1],
				)
			: undefined;
		if (named && param) {
			values[param.name] =
				named[2] === undefined ? true : wordAs(param, named[2]);
			continue;
		}
		const at = inOrder[next];
		if (!at) throw new Error(`${procedure.name} takes no more words: ${word}`);
		if (at.many) {
			const before = values[at.name];
			values[at.name] = [...(Array.isArray(before) ? before : []), word];
		} else {
			values[at.name] = wordAs(at, word);
			next++;
		}
	}
	const missing = procedure.params.filter(
		(param) =>
			param.required &&
			(values[param.name] === undefined || values[param.name] === ""),
	);
	if (missing.length)
		throw new Error(
			`${procedure.name} needs ${missing.map((param) => param.name).join(", ")}`,
		);
	return values;
}

// the arguments after "--" of a writing function's task
export function taskArgs(procedure: Procedure, values: Values): string[] {
	const args: string[] = [];
	for (const param of procedure.params) {
		const value = values[param.name];
		if (value === undefined || value === "" || value === false) continue;
		const words = (Array.isArray(value) ? value : [value]).map(String);
		if (param.positional) args.push(...words);
		else if (param.kind === "flag")
			args.push(`--${param.option ?? param.name}`);
		else args.push(`--${param.option ?? param.name}`, ...words);
	}
	return args;
}

// a reading shown in a terminal: pages and lists as lines, the rest as JSON
export function shown(value: unknown): string {
	if (value === undefined) return "not gathered here";
	if (typeof value === "string") return value;
	const page = value as { total?: number; offset?: number; items?: unknown[] };
	if (Array.isArray(page.items)) {
		const lines = page.items.map((item) => {
			const one = item as Record<string, unknown>;
			const key = one.ELI ?? one.number ?? one.id ?? "";
			const title = String(one.title ?? one.courtType ?? "");
			return `${String(key).padEnd(14)} ${title}`;
		});
		const from = (page.offset ?? 0) + 1;
		const to = (page.offset ?? 0) + page.items.length;
		return [...lines, `-- ${from}-${to} of ${page.total}`].join("\n");
	}
	if (Array.isArray(value) && value.every((one) => typeof one !== "object"))
		return value.join("\n");
	return JSON.stringify(value, null, 1);
}

// the catalog as data, for the api and the viewer: what this host may start beside it
export function described(procedures: Procedure[], { writing = false } = {}) {
	return procedures.map(({ read, ...rest }) => ({
		...rest,
		reads: Boolean(read),
		allowed: !rest.writes || writing,
	}));
}
