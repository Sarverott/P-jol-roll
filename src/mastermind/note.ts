import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LocalTool } from "./ask.js";

/*
The executive agent's only way to write (phase 33): write_note, a markdown file of a bare name
into one folder (resources/agent/ for the agent) - no folder of its own, no way out of it, so
nothing else of the repository can be touched.
*/
export function noteTool(folder: string): LocalTool {
	return {
		name: "write_note",
		description:
			"Write a markdown file into resources/agent/ (the only place you may write): its name and its whole content.",
		inputSchema: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: 'a file name, like "notes-1919.md"',
				},
				content: { type: "string", description: "the whole markdown" },
			},
			required: ["name", "content"],
		},
		run: async (input) => {
			const name = String(input.name ?? "")
				.split(/[\\/]/)
				.pop()
				?.replace(/[^\w.-]+/g, "-")
				.replace(/^\.+/, "")
				.replace(/(\.md)?$/, ".md");
			const content = String(input.content ?? "");
			if (!name || name === ".md" || !content)
				return { ok: false, text: "write_note needs a name and a content" };
			mkdirSync(folder, { recursive: true });
			writeFileSync(
				join(folder, name),
				content.endsWith("\n") ? content : `${content}\n`,
			);
			return {
				ok: true,
				text: `written resources/agent/${name} (${content.length} characters)`,
			};
		},
	};
}
