// NOTE: give me here base for windowed app. it will be good to promotion this way of our opensource work.
// ANSWER: done - the app is put together here from the modules laid out beside: core (the api),
// window, loadingmodal, menus with hotkeys-shortcuts, apptray, notifications, dialogs, deeplinks,
// printing (Q17: print and PDF from the menus and the tray); webserial and webbluethooth wait
// for the devices of Q17 (Bluetooth printers and phones, FIDO keys) - ROADMAP M5

import { app } from "electron";
import { setTray } from "./apptray.js";
import { startApi } from "./core.js";
import { handleLinks, hashOf, linkIn } from "./deeplinks.js";
import { chooseBluetooth } from "./devices.js";
import { failure } from "./dialogs.js";
import { showLoading } from "./loadingmodal.js";
import { setMenu } from "./menus.js";
import { notifyChanges } from "./notifications.js";
import { setContextMenu } from "./printing.js";
import { bringUp, createWindow } from "./window.js";

/*
Window around the same viewer as the website: the api (src/openapi) runs as a child process on
a free port of this machine only, and the window shows what it serves.
Build the website first - "task web:build" - then "task desktop".
DESKTOP_CHECK=1 starts it with every window hidden, prints what the viewer shows and quits
(task desktop:check) - a check that needs no screen.
*/

const CHECK = Boolean(process.env.DESKTOP_CHECK);

// one window is enough - a second start shows the first one (and hands over its link), and
// ends before it starts an api of its own
if (!app.requestSingleInstanceLock()) {
	app.quit();
	process.exit(0);
}

const api = startApi();
let window;

const showWindow = () => bringUp(window);
const openAt = (hash) => {
	if (!hash || !window) return showWindow();
	window.webContents.executeJavaScript(
		`location.hash = ${JSON.stringify(hash)}`,
	);
	showWindow();
};

async function open() {
	const closeLoading = showLoading({ show: !CHECK });
	let address;
	try {
		address = await api.address;
	} catch (error) {
		closeLoading();
		if (CHECK) console.error(error.message);
		else failure(error);
		return app.quit();
	}
	// a link the app was started with: the place to open
	const start = hashOf(linkIn(process.argv)) ?? "";
	// localhost, not 127.0.0.1: WebAuthn (signing with a FIDO key, phase 40) takes no IP address
	window = createWindow(
		`${address.replace("//127.0.0.1:", "//localhost:")}/${start}`,
		{ show: false },
	);
	setMenu(() => window, address);
	setContextMenu(window, address);
	chooseBluetooth(window);
	window.once("ready-to-show", () => {
		closeLoading();
		if (!CHECK) window.show();
	});
	if (CHECK) return check();
	setTray(showWindow, () => window, address);
	const stopNotices = notifyChanges(address, showWindow);
	app.on("will-quit", stopNotices);
}

// what the viewer shows once it has read the journals, then the end
async function check() {
	await new Promise((done) => window.webContents.once("did-finish-load", done));
	await new Promise((done) => setTimeout(done, 3000));
	const seen = await window.webContents.executeJavaScript(
		'[document.title, document.querySelectorAll(".list-items a").length, document.querySelector(".tabs")?.innerText.replace(/\\n/g, " | ")]',
	);
	console.log(`desktop check: ${JSON.stringify(seen)}`);
	app.quit();
}

handleLinks(openAt);
app.whenReady().then(open, () => app.quit());
// closing the window ends the app: a tray is not shown on every desktop of Linux, and a hidden
// app with no icon could not be found again
app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => api.stop());
