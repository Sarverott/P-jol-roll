// NOTE: standard thing is to think about basic approachable http api headless host. add in it websocket connectivity by socket.io for live info exchanges
import { serve } from "./server.js";

// HOST=0.0.0.0 to be reached from outside (docker, coolify); by default only this machine.
// PORT=0 lets the system pick a free port - the address is printed either way
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const host = process.env.HOST ?? "127.0.0.1";

// started by a window (src/desktop): when the window is gone, its pipe closes and the api goes too,
// so no api is left behind holding the port
if (process.env.EXIT_WITH_PARENT) {
	process.stdin.on("end", () => process.exit(0));
	process.stdin.resume();
}

try {
	const { url } = await serve({ port, host });
	console.log(
		`P_JOL_ROLL api listening on ${url} - description at ${url}/openapi.json`,
	);
} catch (error) {
	if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error;
	console.error(
		`${host}:${port} is taken - an api started earlier may still run there (ss -ltnp | grep :${port}), or choose another: PORT=8081 task serve`,
	);
	process.exit(1);
}
