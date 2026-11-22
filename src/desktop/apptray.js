import { fileURLToPath } from "node:url";
import { app, Menu, nativeImage, Tray } from "electron";

/*
The icon of the app in the tray of the system: a click brings the window up; its menu shows the
window or ends the app. The icon is the favicon of the website (scripts/devops/media/build.sh).
*/

export const iconPath = fileURLToPath(
	new URL("../web/public/icon-192.png", import.meta.url),
);

let tray;

export function setTray(showWindow) {
	const image = nativeImage
		.createFromPath(
			fileURLToPath(new URL("../web/public/favicon-32.png", import.meta.url)),
		)
		.resize({ width: 22, height: 22 });
	tray = new Tray(image);
	tray.setToolTip("P_JOL_ROLL - Polish journals of laws");
	tray.setContextMenu(
		Menu.buildFromTemplate([
			{ label: "Show P_JOL_ROLL", click: showWindow },
			{ type: "separator" },
			{ label: "Quit", click: () => app.quit() },
		]),
	);
	tray.on("click", showWindow);
	return tray;
}
