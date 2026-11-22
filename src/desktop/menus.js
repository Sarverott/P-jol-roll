import { app, Menu, shell } from "electron";
import { about } from "./dialogs.js";
import { KEYS } from "./hotkeys-shortcuts.js";
import { go } from "./window.js";

/*
The menu of the app: the screens of the viewer, the view, and where the project is. Each item
carries its key (hotkeys-shortcuts.js).
*/

const DOCS = "https://sarverott.github.io/P-jol-roll/docs/";
const CODE = "https://github.com/Sarverott/P-jol-roll";

export function setMenu(getWindow) {
	const web = () => getWindow()?.webContents;
	const template = [
		{
			label: "P_JOL_ROLL",
			submenu: [
				{ label: "About", click: () => about(getWindow()) },
				{ type: "separator" },
				{ label: "Quit", accelerator: KEYS.quit, click: () => app.quit() },
			],
		},
		{
			label: "Go",
			submenu: [
				{
					label: "Acts",
					accelerator: KEYS.acts,
					click: () => go(getWindow(), "#acts"),
				},
				{
					label: "The act chosen last",
					accelerator: KEYS.act,
					click: () =>
						web()?.executeJavaScript(
							"document.querySelector(\".tabs a[href^='#act/']\")?.click()",
						),
				},
				{
					label: "Map of the whole law",
					accelerator: KEYS.map,
					click: () => go(getWindow(), "#map"),
				},
				{ type: "separator" },
				{
					label: "Back",
					accelerator: KEYS.back,
					click: () => web()?.navigationHistory.goBack(),
				},
				{
					label: "Forward",
					accelerator: KEYS.forward,
					click: () => web()?.navigationHistory.goForward(),
				},
			],
		},
		{
			label: "View",
			submenu: [
				{
					label: "Reload",
					accelerator: KEYS.reload,
					click: () => web()?.reload(),
				},
				{
					label: "Full screen",
					accelerator: KEYS.fullscreen,
					click: () => getWindow()?.setFullScreen(!getWindow()?.isFullScreen()),
				},
				{ type: "separator" },
				{ label: "Zoom in", accelerator: KEYS.zoomIn, role: "zoomIn" },
				{ label: "Zoom out", accelerator: KEYS.zoomOut, role: "zoomOut" },
				{
					label: "Actual size",
					accelerator: KEYS.zoomReset,
					role: "resetZoom",
				},
				{ type: "separator" },
				{
					label: "Developer tools",
					accelerator: KEYS.devtools,
					click: () => web()?.toggleDevTools(),
				},
			],
		},
		{
			label: "Help",
			submenu: [
				{ label: "Documentation", click: () => shell.openExternal(DOCS) },
				{ label: "The code", click: () => shell.openExternal(CODE) },
			],
		},
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
