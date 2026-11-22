import type { CatalogScope } from "../vars/interfaces/index.js";
import { GROUPS, PROCEDURES } from "./procedures.js";

// the catalog in words, for terminals: every function by its group, or one with what it takes
export function overview() {
	const lines: string[] = [];
	for (const [group, title] of Object.entries(GROUPS)) {
		lines.push(`\n${title}`);
		for (const one of PROCEDURES.filter((p) => p.group === group))
			lines.push(`  ${one.name.padEnd(24)} ${one.title}`);
	}
	return lines.join("\n");
}

export function described(procedure: CatalogScope.Procedure) {
	const lines = [`${procedure.name} - ${procedure.title}`];
	if (!procedure.params.length) lines.push("  takes nothing");
	for (const param of procedure.params) {
		const how = param.positional
			? "a word"
			: param.kind === "flag"
				? `--${param.option ?? param.name}`
				: `${param.name}=...`;
		const more = [
			param.choices?.length
				? `one of ${param.choices.map((c) => c || '""').join(", ")}`
				: "",
			param.default !== undefined && param.default !== ""
				? `default ${param.default}`
				: "",
			param.required ? "needed" : "",
			param.many ? "several" : "",
		].filter(Boolean);
		lines.push(
			`  ${param.name.padEnd(10)} ${param.title}${more.length ? ` (${more.join("; ")})` : ""} - ${how}`,
		);
	}
	lines.push(
		procedure.read
			? "  reads what is gathered here and shows it"
			: `  runs: task ${procedure.task}${procedure.writes ? " (it writes)" : ""}`,
	);
	return lines.join("\n");
}
