import { existsSync, watch } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import express from "express";
import { Server as SocketServer } from "socket.io";
import * as library from "../core/reading/library.js";
import { DATASET_DIR } from "../core/resources/store.js";
import { routes } from "./routes.js";

/*
Headless host of gathered data: http api (described at /openapi.json), live
notices over socket.io, and the built website (dist/web) when it is there.
Read-only and open to every origin, because the data is public and the
extensions and the android app ask it from elsewhere.
*/

export const WEB_DIR = process.env.WEB_DIR ?? "dist/web";

export function serve({ port = 8080, host = "127.0.0.1", web = WEB_DIR } = {}) {
	const app = express();
	app.disable("x-powered-by");
	app.use((_request, response, next) => {
		response.set("Access-Control-Allow-Origin", "*");
		next();
	});
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
		socket.emit("journals", library.journals());
	});
	let pending: NodeJS.Timeout | undefined;
	const changed = new Set<string>();
	const watcher = existsSync(DATASET_DIR)
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
		(done) =>
			server.listen(port, host, () => {
				const address = server.address();
				const bound =
					typeof address === "object" && address ? address.port : port;
				done({ server, io, url: `http://${host}:${bound}` });
			}),
	);
}
