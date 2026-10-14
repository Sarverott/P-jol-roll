// NOTE: here i think we consider mounting of core functionality for AI agents usage
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import * as library from "../core/reading/library.js";

/*
Gathered law for AI agents, over stdio: the same reading of resources/ that
the http api gives, as tools. Read-only on purpose - gathering is started by
a person, so an agent cannot set off a crawl of the source through here.
  claude mcp add p-jol-roll -- npx tsx src/mcp/main.ts
*/

const server = new McpServer({ name: "p-jol-roll", version: "0.0.1" });
const readOnly = { readOnlyHint: true, openWorldHint: false };

const answer = (value: unknown) => ({
	content: [
		{
			type: "text" as const,
			text: typeof value === "string" ? value : JSON.stringify(value, null, 1),
		},
	],
});
const notHere = (eli: string) => ({
	content: [{ type: "text" as const, text: `${eli} is not gathered here` }],
	isError: true,
});

const eli = z
	.string()
	.describe('ELI of an act: journal/year/position, "DU/2026/1"');

server.registerTool(
	"journals",
	{
		title: "Journals",
		description:
			"Journals of laws gathered here (DU - Dziennik Ustaw, MP - Monitor Polski) with their years.",
		annotations: readOnly,
	},
	async () => answer(library.journals()),
);

server.registerTool(
	"search_acts",
	{
		title: "Search acts of a year",
		description:
			"Acts of one year of one journal whose title has every word of the query (Polish, case does not matter). Empty query lists the year.",
		inputSchema: z.object({
			journal: z.string().describe('"DU" or "MP"'),
			year: z.number().int(),
			query: z.string().default(""),
			offset: z.number().int().min(0).default(0),
			limit: z.number().int().min(1).max(100).default(20),
		}),
		annotations: readOnly,
	},
	async ({ journal, year, query, offset, limit }) => {
		const page = library.acts(journal, year, { query, offset, limit });
		return answer({
			...page,
			items: page.items.map(({ ELI, title, type, status, textHTML }) => ({
				ELI,
				title,
				type,
				status,
				textHTML,
			})),
		});
	},
);

server.registerTool(
	"act",
	{
		title: "Act",
		description:
			"One act: its listing line, details from the source (status, dates, keywords, authority) and which files are gathered.",
		inputSchema: z.object({ eli }),
		annotations: readOnly,
	},
	async ({ eli }) => {
		const view = library.act(eli);
		return view ? answer(view) : notHere(eli);
	},
);

server.registerTool(
	"act_text",
	{
		title: "Text of an act",
		description:
			"Markdown text of an act, in pieces: long acts are read by moving start. Only acts published with HTML have text.",
		inputSchema: z.object({
			eli,
			start: z.number().int().min(0).default(0),
			length: z.number().int().min(1000).max(50000).default(20000),
		}),
		annotations: readOnly,
	},
	async ({ eli, start, length }) => {
		const text = library.text(eli);
		if (text === undefined) return notHere(`text of ${eli}`);
		const end = Math.min(text.length, start + length);
		const more =
			end < text.length
				? `\n\n[characters ${start}-${end} of ${text.length}, continue with start=${end}]`
				: "";
		return answer(text.slice(start, end) + more);
	},
);

server.registerTool(
	"act_references",
	{
		title: "Ties of an act",
		description:
			"Ties to other acts named in details: legal basis, amendments, repeals, executive acts.",
		inputSchema: z.object({ eli }),
		annotations: readOnly,
	},
	async ({ eli }) => {
		const ties = library.references(eli);
		return ties ? answer(ties) : notHere(eli);
	},
);

await server.connect(new StdioServerTransport());
