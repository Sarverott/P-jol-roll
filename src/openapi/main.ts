// NOTE: standard thing is to think about basic approachable http api headless host. add in it websocket connectivity by socket.io for live info exchanges

import log, { logRun } from "../core/logging/setup.js";

logRun("serve");

import { remote } from "../core/reading/remote.js";
import { serve } from "./server.js";
import { isLoopback } from "./writing.js";

// HOST=0.0.0.0 to be reached from outside (docker, coolify); by default only this machine.
// PORT=0 lets the system pick a free port - the address is printed either way
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const host = process.env.HOST ?? "127.0.0.1";

// --allow-writing (or ALLOW_WRITING=1): the writing functions of the catalog started from the
// viewer as jobs (Q19, phase 25) - only on this machine and over its own resources/, never on
// a public host; asked for elsewhere, the api does not start at all rather than quietly read only
const writing =
	process.argv.includes("--allow-writing") || process.env.ALLOW_WRITING === "1";
if (writing && (!isLoopback(host) || remote)) {
	log.error(
		`--allow-writing is for this machine only: HOST=${host}${remote ? ", the remote mode" : ""} - the writing functions run in a terminal there (task do)`,
	);
	process.exit(1);
}

// started by a window (src/desktop): when the window is gone, its pipe closes and the api goes too,
// so no api is left behind holding the port
if (process.env.EXIT_WITH_PARENT) {
	process.stdin.on("end", () => process.exit(0));
	process.stdin.resume();
}

try {
	const { url } = await serve({ port, host, writing });
	log.info(
		`P_JOL_ROLL api listening on ${url} - description at ${url}/openapi.json`,
	);
	if (writing)
		log.info(
			"writing functions allowed: the viewer starts them as jobs, each after a yes (/api/jobs)",
		);
} catch (error) {
	if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error;
	log.error(
		`${host}:${port} is taken - an api started earlier may still run there (ss -ltnp | grep :${port}), or choose another: PORT=8081 task serve`,
	);
	process.exit(1);
}
