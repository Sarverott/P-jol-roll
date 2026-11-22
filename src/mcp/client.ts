import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

/*
A client of the MCP server, to see from a terminal what an agent gets (task mcp:ask):
  tsx src/mcp/client.ts                                  the tools, over stdio (main.ts started here)
  tsx src/mcp/client.ts act eli=DU/2026/1                one tool with its arguments
  MCP_URL=http://127.0.0.1:8080/mcp tsx src/mcp/client.ts journals     over http, a running api
A number given as an argument is a number (year=2026).
*/

export async function connect(url = process.env.MCP_URL) {
	const client = new Client({ name: "p-jol-roll-client", version: "1" });
	await client.connect(
		url
			? new StreamableHTTPClientTransport(new URL(url))
			: new StdioClientTransport({
					command: process.execPath,
					args: ["--import", "tsx", "src/mcp/main.ts"],
				}),
	);
	return client;
}

const value = (text: string) => (/^\d+$/.test(text) ? Number(text) : text);

if (import.meta.url === `file://${process.argv[1]}`) {
	const [tool, ...pairs] = process.argv.slice(2);
	const client = await connect();
	if (!tool) {
		const { tools } = await client.listTools();
		for (const one of tools)
			console.log(`${one.name.padEnd(16)} ${one.title ?? ""}`);
	} else {
		const result = await client.callTool({
			name: tool,
			arguments: Object.fromEntries(
				pairs.map((pair) => {
					const [key, ...rest] = pair.split("=");
					return [key, value(rest.join("="))];
				}),
			),
		});
		for (const part of result.content as { type: string; text?: string }[])
			console.log(part.text ?? part);
		if (result.isError) process.exitCode = 1;
	}
	await client.close();
}
