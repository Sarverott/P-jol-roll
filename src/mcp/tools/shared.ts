import { z } from "zod";
import * as library from "../../core/reading/library.js";

/*
What every tool of the MCP server shares: how an answer is given, how "not here" is said, the
ELI of an act as an input, the hints that the tools only read - and, on a remote host (the
space), taking from Hugging Face what an act needs before it is read, as the api does.
*/
// NOTE: that can be delegated to main.ts in src/mcp/ - universal blocks of code should be reused as often as possible, this is basic optimization of codebase
// ANSWER: done, here rather than in main.ts: main.ts starts the server over stdio as soon as it is
// imported, so every tool importing it would start one; this file is imported by every tool

export const readOnly = { readOnlyHint: true, openWorldHint: false };

export const answer = (value: unknown) => ({
	content: [
		{
			type: "text" as const,
			text: typeof value === "string" ? value : JSON.stringify(value, null, 1),
		},
	],
});

export const notHere = (what: string) => ({
	content: [{ type: "text" as const, text: `${what} is not gathered here` }],
	isError: true,
});

export const eli = z
	.string()
	.describe('ELI of an act: journal/year/position, "DU/2026/1"');

// "DU/2026/1" taken from Hugging Face first when the host is remote (a no-op on a full copy)
export async function ready(address?: string) {
	const [journal, year, pos] = (address ?? "").split("/");
	await library.prepare(
		journal || undefined,
		year ? Number(year) : undefined,
		pos ? Number(pos) : undefined,
	);
}
