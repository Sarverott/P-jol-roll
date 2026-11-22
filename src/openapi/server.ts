import { existsSync, watch } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { toNodeHandler } from "@modelcontextprotocol/node";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { Server as SocketServer } from "socket.io";
import * as library from "../core/reading/library.js";
import { remote } from "../core/reading/remote.js";
import { DATASET_DIR } from "../core/resources/store.js";
import { mcpHandler } from "../mcp/server.js";
import { routes } from "./routes.js";

/*
Headless host of gathered data: http api (described at /openapi.json), the MCP server of
src/mcp at /mcp (streamable http, stateless), live notices over socket.io, and the built
website (dist/web) when it is there.
Read-only and open to every origin, because the data is public and the
extensions and the android app ask it from elsewhere.
*/

export const WEB_DIR = process.env.WEB_DIR ?? "dist/web";

/*
Requests of one address in a minute (RATE_LIMIT, 0 - no limit): the demo is public and every
answer reads files, so one client cannot keep the disk busy for the others (CodeQL
js/missing-rate-limiting, docs/almanac/cataclistics/codeql-first-scan.md). Behind a proxy
(the space, the routing proxy) TRUST_PROXY=1 lets the address come from X-Forwarded-For.
*/
const RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 600);
const TRUST_PROXY = Number(process.env.TRUST_PROXY ?? 0);

export function serve({ port = 8080, host = "127.0.0.1", web = WEB_DIR } = {}) {
	const app = express();
	app.disable("x-powered-by");
	if (TRUST_PROXY) app.set("trust proxy", TRUST_PROXY);
	if (RATE_LIMIT > 0)
		app.use(
			rateLimit({
				windowMs: 60_000,
				limit: RATE_LIMIT,
				standardHeaders: "draft-8",
				legacyHeaders: false,
				message: { error: "too many requests - wait a minute" },
			}),
		);
	app.use((_request, response, next) => {
		response.set("Access-Control-Allow-Origin", "*");
		// readers on other origins (extension, pages) may read where a text came from
		response.set("Access-Control-Expose-Headers", "X-Text-From");
		next();
	});
	// the tools of src/mcp for agents elsewhere; a fresh server per request
	app.all("/mcp", toNodeHandler(mcpHandler()));
	app.use(routes);
	if (existsSync(web)) app.use(express.static(resolve(web)));
	else
		app.get("/", (_request, response) => {
			response
				.type("text/plain")
				.send(`P_JOL_ROLL api - /openapi.json; website is not built (${web})`);
		});

	const server = createServer(app);
	const io = new SocketServer(server, { cors: { origin: "*" } });

	// every client gets what is here now, and a notice when a table of dataset changes
	io.on("connection", (socket) => {
		library.prepare().then(() => socket.emit("journals", library.journals()));
	});
	let pending: NodeJS.Timeout | undefined;
	const changed = new Set<string>();
	// remotely the dataset here is a cache: what lands in it is no news
	const watcher =
		!remote && existsSync(DATASET_DIR)
			? watch(DATASET_DIR, { recursive: true }, (_event, name) => {
					if (!name || name.endsWith(".part")) return;
					changed.add(name.toString());
					clearTimeout(pending);
					pending = setTimeout(() => {
						io.emit("changed", [...changed]);
						changed.clear();
					}, 1000);
				})
			: undefined;
	server.on("close", () => {
		watcher?.close();
		clearTimeout(pending);
	});

	return new Promise<{ server: typeof server; io: SocketServer; url: string }>(
		(done, fail) => {
			// a port that is taken ends here, not as an error thrown from nowhere
			server.once("error", fail);
			server.listen(port, host, () => {
				const address = server.address();
				const bound =
					typeof address === "object" && address ? address.port : port;
				done({ server, io, url: `http://${host}:${bound}` });
			});
		},
	);
}
