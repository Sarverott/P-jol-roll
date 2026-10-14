// NOTE: give me here base for windowed app. it will be good to promotion this way of our opensource work.

import { spawn } from "node:child_process";
import { app, BrowserWindow, shell } from "electron";

app.commandLine.appendSwitch('no-sandbox'); 

/*
Window around the same viewer as the website: the api (src/openapi) runs as a
child process on a port of this machine only, and the window shows what it serves.
Build the website first - "task web:build" - then "task desktop".
*/

const PORT = process.env.PORT ?? "18080";
const url = `http://127.0.0.1:${PORT}`;

// node from PATH runs the api with tsx, the same way "task serve" does
const api = spawn("npx", ["tsx", "src/openapi/main.ts"], {
	env: { ...process.env, PORT, HOST: "127.0.0.1" },
	stdio: ["ignore", "pipe", "inherit"],
	shell: process.platform === "win32",
});
const listening = new Promise((done, fail) => {
	api.stdout.on("data", (chunk) => {
		process.stdout.write(chunk);
		if (chunk.toString().includes("listening")) done();
	});
	api.on("exit", (code) => fail(new Error(`api stopped with ${code}`)));
});

async function open() {
	await listening;
	const window = new BrowserWindow({
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

app.whenReady().then(open);
app.on("window-all-closed", () => app.quit());
app.on("quit", () => api.kill());
