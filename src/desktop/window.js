import { BrowserWindow, shell } from "electron";
import { iconPath } from "./apptray.js";

/*
The window of the viewer: the same page the website shows, served by the app's own api. Links
that lead away from the viewer (PDFs, the source) open in the system's browser.
*/

export function createWindow(url, { show = true } = {}) {
	const window = new BrowserWindow({
		width: 1280,
		height: 860,
		title: "P_JOL_ROLL",
		icon: iconPath,
		show,
		webPreferences: { contextIsolation: true, sandbox: true },
	});
	window.webContents.setWindowOpenHandler(({ url: target }) => {
		shell.openExternal(target);
		return { action: "deny" };
	});
	window.loadURL(url);
	return window;
}

// a second start of the app brings this window up instead
export function bringUp(window) {
	if (!window) return;
	if (window.isMinimized()) window.restore();
	window.show();
	window.focus();
}

// a screen or an act of the viewer: the address after "#" (src/gui/assets/route.js)
export const go = (window, hash) =>
	window?.webContents.executeJavaScript(
		`location.hash = ${JSON.stringify(hash)}`,
	);
