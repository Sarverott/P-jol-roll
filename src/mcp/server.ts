import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import act from "./tools/act/function.js";
import actMeta from "./tools/act/metadata.js";
import actReferences from "./tools/act_references/function.js";
import actReferencesMeta from "./tools/act_references/metadata.js";
import actText from "./tools/act_text/function.js";
import actTextMeta from "./tools/act_text/metadata.js";
import journals from "./tools/journals/function.js";
import journalsMeta from "./tools/journals/metadata.js";
import searchActs from "./tools/search_acts/function.js";
import searchActsMeta from "./tools/search_acts/metadata.js";
import sejmWork from "./tools/sejm_work/function.js";
import sejmWorkMeta from "./tools/sejm_work/metadata.js";
import sourceList from "./tools/source_list/function.js";
import sourceListMeta from "./tools/source_list/metadata.js";
import statistics from "./tools/statistics/function.js";
import statisticsMeta from "./tools/statistics/metadata.js";

/*
The MCP server of gathered law: every tool of tools/ (a folder each - metadata.ts says what it
is, function.ts what it does), read-only. One factory serves both ways in:
  over stdio      main.ts - an agent on this machine starts it (claude mcp add ...)
  over http       /mcp of the api (src/openapi/server.ts) - the container, the demo space
Gathering is started by a person, so an agent cannot set off a crawl of the source through here.
*/

export function createServer() {
	const server = new McpServer({ name: "p-jol-roll", version: "0.24.5" });
	server.registerTool("journals", journalsMeta, journals);
	server.registerTool("search_acts", searchActsMeta, searchActs);
	server.registerTool("act", actMeta, act);
	server.registerTool("act_text", actTextMeta, actText);
	server.registerTool("act_references", actReferencesMeta, actReferences);
	server.registerTool("statistics", statisticsMeta, statistics);
	server.registerTool("sejm_work", sejmWorkMeta, sejmWork);
	server.registerTool("source_list", sourceListMeta, sourceList);
	return server;
}

// the http face: a fresh server per request, stateless, as the api is
export const mcpHandler = () => createMcpHandler(createServer);
