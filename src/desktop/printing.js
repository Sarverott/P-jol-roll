import { writeFile } from "node:fs/promises";
import { dialog, Menu } from "electron";
import { printLabel, showForPhone, signPdf } from "./devices.js";

/*
Printing from the app (Q17, changelog phase 22): what the window shows - an act on its own
screen prints as its text alone (the viewer's print styles hide the rest) - on a printer of the
system, or into a PDF file. Offered by the menu of the window, its right-click menu and the
tray. Signing with a FIDO key, labels for Bluetooth sticker printers and the act for a phone: devices.js (phase 40).
*/

// the system's dialog of printing: the printer, the pages, the copies
export function print(window) {
	window?.webContents.print({ printBackground: false }, (done, reason) => {
		if (!done && reason !== "cancelled")
			dialog.showErrorBox("P_JOL_ROLL", `Not printed: ${reason}`);
	});
}

// a PDF of what the window shows, where the person chooses
export async function saveAsPdf(window) {
	if (!window) return;
	const title = window.webContents.getTitle() || "P_JOL_ROLL";
	const hash = await window.webContents.executeJavaScript("location.hash");
	const name = `${(hash.replace(/^#act\//, "").replace(/\W+/g, "-") || title).replace(/^-|-$/g, "")}.pdf`;
	const { canceled, filePath } = await dialog.showSaveDialog(window, {
		defaultPath: name,
		filters: [{ name: "PDF", extensions: ["pdf"] }],
	});
	if (canceled || !filePath) return;
	await writeFile(filePath, await window.webContents.printToPDF({}));
}

// the right-click menu of the window: copy what is chosen, print, back and forward
export function setContextMenu(window, address) {
	window.webContents.on("context-menu", (_event, where) => {
		const web = window.webContents;
		Menu.buildFromTemplate([
			{ label: "Copy", role: "copy", enabled: Boolean(where.selectionText) },
			{ type: "separator" },
			{ label: "Print...", click: () => print(window) },
			{ label: "Save as PDF...", click: () => saveAsPdf(window) },
			{ label: "Save as PDF and sign...", click: () => signPdf(window) },
			{ label: "Print a label...", click: () => printLabel(window, address) },
			{ label: "Show it for a phone", click: () => showForPhone(window) },
			{ type: "separator" },
			{
				label: "Back",
				enabled: web.navigationHistory.canGoBack(),
				click: () => web.navigationHistory.goBack(),
			},
			{
				label: "Forward",
				enabled: web.navigationHistory.canGoForward(),
				click: () => web.navigationHistory.goForward(),
			},
		]).popup({ window });
	});
}
