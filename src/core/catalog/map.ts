import { writeFileSync } from "node:fs";
import { at } from "../paths/at.js";
import type { CatalogScope as CatalogTypes } from "../vars/types/index.js";
import { GROUPS, PROCEDURES } from "./procedures.js";

/*
The map of functions (docs/guides/functions.md), written from the catalog by
"task functions:map": every function in a row, every way the project runs in a column. The
launcher, the REPL and "task do" offer every function, so their columns are full; the others
say where they offer it, and a hole is an empty cell.
*/

const WAYS: [CatalogTypes.Way, string][] = [
	["viewer", "viewer"],
	["api", "api"],
	["mcp", "MCP"],
	["cli", "CLI"],
	["extension", "extension"],
	["workflows", "workflows"],
];

const cell = (value?: string) => (value ? `\`${value}\`` : "–");

export function functionsMap() {
	const lines = [
		"# Functions",
		"",
		"Every function of the project and every way it runs - written by",
		"`task functions:map` from the catalog (`src/core/catalog/procedures.ts`),",
		"so do not edit it by hand. The launcher (bare `task`), its REPL and",
		"`task do` offer every function; the other ways where a cell names how. A",
		"writing function (✎) is offered on a host only after Q19; the viewer shows",
		"it disabled until then. `–` is a hole.",
		"",
		`| Function | | launcher, REPL, \`task do\` | ${WAYS.map(([, title]) => title).join(" | ")} |`,
		`| -------- | - | :-: | ${WAYS.map(() => ":-:").join(" | ")} |`,
	];
	for (const [group, title] of Object.entries(GROUPS)) {
		lines.push(`| **${title}** | | | ${WAYS.map(() => "").join(" | ")} |`);
		for (const one of PROCEDURES.filter((p) => p.group === group)) {
			const here = one.read ? "✓" : `✓ \`task ${one.task}\``;
			const ways = WAYS.map(([way]) => {
				if (one.writes && (way === "viewer" || way === "api"))
					return "disabled (Q19)";
				return cell(one.ways[way]);
			});
			lines.push(
				`| \`${one.name}\` ${one.title} | ${one.writes ? "✎" : ""} | ${here} | ${ways.join(" | ")} |`,
			);
		}
	}
	return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	writeFileSync(at("docs/guides/functions.md"), functionsMap());
	console.log("docs/guides/functions.md written");
}
