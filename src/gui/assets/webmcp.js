import "@mcp-b/global";

/*
WebMCP (phase 22): the reading of the viewer offered to an AI agent in this browser through
document.modelContext (the W3C draft; @mcp-b/global gives it where the browser does not yet).
The same reading as the api and the MCP server, asked of the same host; one more tool moves
the viewer to an act or a screen, so the person sees what the agent read. Read-only, as /mcp.
*/

const text = (value) => ({
	content: [
		{
			type: "text",
			text: typeof value === "string" ? value : JSON.stringify(value),
		},
	],
});

const ELI = {
	type: "string",
	description: 'ELI of an act: journal/year/position, "DU/2026/1"',
};

export function offerTools(library) {
	const context = globalThis.document?.modelContext;
	if (!context?.registerTool) return () => {};
	const stop = new AbortController();
	const read = async (path, as) =>
		text((await library.ask(path, as)) ?? "not gathered here");
	const tools = [
		{
			name: "journals",
			description: "Journals of laws gathered on this host, with their years.",
			inputSchema: { type: "object", properties: {} },
			execute: () => read("/api/journals"),
		},
		{
			name: "search_acts",
			description:
				"Acts of a year of a journal whose titles have every word of the query.",
			inputSchema: {
				type: "object",
				properties: {
					journal: { type: "string", enum: ["DU", "MP"] },
					year: { type: "integer" },
					query: { type: "string" },
				},
				required: ["journal", "year"],
			},
			execute: ({ journal, year, query = "" }) =>
				read(
					`/api/acts/${journal}/${year}?q=${encodeURIComponent(query)}&limit=50`,
				),
		},
		{
			name: "act",
			description:
				"One act: its line of the listing, details and gathered files.",
			inputSchema: {
				type: "object",
				properties: { eli: ELI },
				required: ["eli"],
			},
			execute: ({ eli }) => read(`/api/acts/${eli}`),
		},
		{
			name: "act_text",
			description: "The text of an act as markdown.",
			inputSchema: {
				type: "object",
				properties: { eli: ELI },
				required: ["eli"],
			},
			execute: ({ eli }) => read(`/api/acts/${eli}/text`, "text"),
		},
		{
			name: "statistics",
			description: "The acts counted year by year: total, by type, by status.",
			inputSchema: { type: "object", properties: {} },
			execute: () => read("/api/statistics"),
		},
		{
			name: "show",
			description:
				"Move the viewer the person is looking at to an act (eli) or to a screen: acts, map, data, plots, statistics, settings.",
			inputSchema: {
				type: "object",
				properties: {
					eli: ELI,
					screen: {
						type: "string",
						enum: ["acts", "map", "data", "plots", "statistics", "settings"],
					},
				},
			},
			execute: ({ eli, screen }) => {
				location.hash = eli ? `#act/${eli}` : `#${screen ?? "acts"}`;
				return text(`shown: ${location.hash}`);
			},
		},
	];
	for (const tool of tools)
		Promise.resolve(context.registerTool(tool, { signal: stop.signal })).catch(
			() => {},
		);
	return () => stop.abort();
}
