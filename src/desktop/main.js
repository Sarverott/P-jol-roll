// NOTE: give me here base for windowed app. it will be good to promotion this way of our opensource work.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, shell } from "electron";

/*
Window around the same viewer as the website: the api (src/openapi) runs as a
child process on a free port of this machine only, and the window shows what it serves.
Build the website first - "task web:build" - then "task desktop".
*/

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// one window is enough - a second start shows the first one
if (!app.requestSingleInstanceLock()) app.quit();

// one process only: node with the tsx loader, not npx -> tsx -> node, whose last child
// outlived the window and kept the port. PORT=0 - the system gives a port that is free.
// The api watches its stdin and ends when this process is gone, even after a crash
const api = spawn("node", ["--import", "tsx", "src/openapi/main.ts"], {
	cwd: ROOT,
	env: { ...process.env, PORT: "0", HOST: "127.0.0.1", EXIT_WITH_PARENT: "1" },
	stdio: ["pipe", "pipe", "inherit"],
	shell: process.platform === "win32",
});
const address = new Promise((done, fail) => {
	let said = "";
	api.stdout.on("data", (chunk) => {
		process.stdout.write(chunk);
		said += chunk;
		const found = /listening on (http:\/\/\S+)/.exec(said);
		if (found) done(found[1]);
	});
	api.on("exit", (code) => fail(new Error(`api stopped with ${code}`)));
});

let window;

async function open() {
	const url = await address;
	window = new BrowserWindow({
		width: 1280,
		height: 860,
		title: "P_JOL_ROLL",
		webPreferences: { contextIsolation: true, sandbox: true },
	});
	window.removeMenu();
	// links that lead away from the viewer (PDF, sources) open in the system browser
	window.webContents.setWindowOpenHandler(({ url: target }) => {
		shell.openExternal(target);
		return { action: "deny" };
	});
	await window.loadURL(url);
}

app.on("second-instance", () => {
	if (!window) return;
	if (window.isMinimized()) window.restore();
	window.focus();
});
app.whenReady().then(open, () => app.quit());
app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => api.kill());
