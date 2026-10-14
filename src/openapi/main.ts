// NOTE: standard thing is to think about basic approachable http api headless host. add in it websocket connectivity by socket.io for live info exchanges
import { serve } from "./server.js";

// HOST=0.0.0.0 to be reached from outside (docker, coolify); by default only this machine
const { url } = await serve({
	port: Number(process.env.PORT) || 8080,
	host: process.env.HOST ?? "127.0.0.1",
});
console.log(
	`P_JOL_ROLL api listening on ${url} - description at ${url}/openapi.json`,
);
