// NOTE: here i think we consider mounting of core functionality for AI agents usage
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

/*
Gathered law for AI agents, over stdio: the same reading of resources/ that the http api
gives, as tools (server.ts, tools/). Read-only on purpose - gathering is started by a person.
  claude mcp add p-jol-roll -- npx tsx src/mcp/main.ts
The same tools over http: /mcp of the api - task serve here, the demo space there.
  claude mcp add --transport http p-jol-roll https://sarverott-docs-of-law-by-gov-in-poland.hf.space/mcp
*/

// NOTE: can we add it with container to be published inside docker serving from space host? this can be handy
// ANSWER: done - webapp-server answers MCP at /mcp (src/openapi/server.ts), so the image, the
// space and task serve all serve it; it reads through the same remote cache as the api there

serveStdio(createServer);
