import type { GatheringScope } from "../vars/interfaces/index.js";

/*
The ties of an act drawn one way everywhere (phase 14): one mermaid flowchart, made here and
nowhere else - the api gives it (/diagram), the MCP server gives it (act_references with
as=mermaid), the viewer renders it. The act stands on the left; each kind of tie is a group
of the acts it names, at most {per} of them and a node saying how many more.
*/

const node = (index: number) => `a${index}`;
// mermaid labels in quotes: a quote of the source becomes its entity
const label = (text: string) => `"${text.replace(/"/g, "#quot;")}"`;

export function tiesDiagram(
	eli: string,
	ties: GatheringScope.Edge[],
	{ per = 8, titles = new Map<string, string>() } = {},
) {
	const lines = ["flowchart LR", `\ta0[${label(eli)}]:::act`];
	const kinds = new Map<string, string[]>();
	for (const { type, to } of ties) {
		const named = kinds.get(type) ?? [];
		if (!named.includes(to)) named.push(to);
		kinds.set(type, named);
	}
	let next = 1;
	let group = 0;
	for (const [type, named] of kinds) {
		group += 1;
		lines.push(`\tsubgraph g${group}[${label(type)}]`);
		const shown = named.slice(0, per);
		const ids: string[] = [];
		for (const to of shown) {
			const id = node(next++);
			ids.push(id);
			const title = titles.get(to);
			lines.push(`\t\t${id}[${label(title ? `${to}<br/>${title}` : to)}]`);
		}
		if (named.length > shown.length) {
			const id = node(next++);
			ids.push(id);
			lines.push(
				`\t\t${id}[${label(`+${named.length - shown.length} more`)}]:::more`,
			);
		}
		lines.push("\tend");
		lines.push(`\ta0 --> g${group}`);
		// the ELI of each node, for readers that open an act on a click
		for (const [at, id] of ids.entries())
			if (shown[at]) lines.push(`\t%% ${id} ${shown[at]}`);
	}
	lines.push("\tclassDef act fill:#1d2440,color:#f3efe4,stroke:#1d2440");
	lines.push("\tclassDef more fill:none,stroke-dasharray:4 3");
	return `${lines.join("\n")}\n`;
}
