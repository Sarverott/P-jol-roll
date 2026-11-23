import {
	json,
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import type { Server as SocketServer } from "socket.io";
import * as jobs from "../core/catalog/jobs.js";
import { PROCEDURES } from "../core/catalog/procedures.js";
import { valuesOf } from "../core/catalog/run.js";

/*
The writing functions of the catalog, started by this host (Q19, answered in phase 25): only
when the api is started with --allow-writing on this machine (127.0.0.1, ::1, localhost) and
reads its own resources/ (not the remote mode of the demo). A public host - the space, the
container, the website - never has them, and the viewer shows them disabled there.

The rest of the api is open to every origin; these routes are not. A request is taken only
when it is addressed to this machine by name (no DNS rebinding), comes from the api's own
pages (Origin, when the browser sends one, is the api itself), is JSON (so another page's
form cannot send it without a preflight, which nothing here answers), and says the person
agreed ("yes": true) - the viewer asks before it sends.
*/

const LOOPBACK = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;

export const isLoopback = (host: string) =>
	["127.0.0.1", "::1", "localhost"].includes(host);

// a request not taken: its status and why, as every route of the api answers
function refuse(response: Response, status: number, error: string) {
	response.status(status).json({ error });
}

function guard(request: Request, response: Response, next: NextFunction): void {
	const host = request.get("host") ?? "";
	const origin = request.get("origin");
	if (!LOOPBACK.test(host)) {
		refuse(response, 403, "only on this machine");
		return;
	}
	if (origin && origin !== `http://${host}`) {
		refuse(response, 403, "only from the pages of this api");
		return;
	}
	if (request.method === "POST" && !request.is("application/json")) {
		refuse(response, 415, "JSON only");
		return;
	}
	next();
}

export function writingRoutes(io: SocketServer) {
	const routes = Router();
	routes.use("/api/jobs", guard);

	routes.get("/api/jobs", (_request, response) => {
		response.json(jobs.list());
	});

	routes.get("/api/jobs/:id", (request, response) => {
		const job = jobs.get(Number(request.params.id));
		if (job) response.json(job);
		else response.status(404).json({ error: "no such job" });
	});

	// { name: "stats", words: ["2026"], yes: true } - words as for "task do"
	routes.post(
		"/api/jobs",
		json({ limit: "16kb" }),
		(request, response): void => {
			const { name, words = [], yes } = request.body ?? {};
			const procedure = PROCEDURES.find(
				(one) => one.name === name && one.writes && one.task,
			);
			if (!procedure) {
				refuse(response, 404, "no such writing function");
				return;
			}
			if (yes !== true) {
				refuse(response, 400, "a person says yes before a job starts");
				return;
			}
			if (
				!Array.isArray(words) ||
				words.some((word) => typeof word !== "string")
			) {
				refuse(response, 400, "words are a list of text");
				return;
			}
			try {
				const values = valuesOf(procedure, words);
				// socket.io is open to every origin: it hears only that a job ended, never its lines
				const job = jobs.start(procedure, values, (changed) => {
					if (changed.state !== "running")
						io.emit("job", { id: changed.id, state: changed.state });
				});
				response.status(202).json(job);
			} catch (error) {
				const busy = jobs.running();
				response
					.status(busy ? 409 : 400)
					.json({ error: (error as Error).message });
			}
		},
	);
	return routes;
}
