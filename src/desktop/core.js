import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/*
The api (src/openapi) as a child of the app: one process only - node with the tsx loader, not
npx -> tsx -> node, whose last child outlived the window and kept the port. PORT=0: the system
gives a port that is free, on this machine only. The api watches its stdin and ends when the
app is gone, even after a crash (EXIT_WITH_PARENT).
*/

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));

export function startApi() {
	const child = spawn("node", ["--import", "tsx", "src/openapi/main.ts"], {
		cwd: ROOT,
		env: {
			...process.env,
			PORT: "0",
			HOST: "127.0.0.1",
			EXIT_WITH_PARENT: "1",
		},
		stdio: ["pipe", "pipe", "inherit"],
		shell: process.platform === "win32",
	});
	// the address the api says it listens on
	const address = new Promise((done, fail) => {
		let said = "";
		child.stdout.on("data", (chunk) => {
			process.stdout.write(chunk);
			said += chunk;
			const found = /listening on (http:\/\/\S+)/.exec(said);
			if (found) done(found[1]);
		});
		child.on("exit", (code) => fail(new Error(`the api stopped with ${code}`)));
	});
	return { address, stop: () => child.kill() };
}
