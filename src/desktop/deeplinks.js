import { app } from "electron";

/*
Links into the app: p-jol-roll://act/DU/2026/1 opens that act, p-jol-roll://map the map - the
same places as the viewer's address after "#" (src/gui/assets/route.js). A link reaches the app
as an argument (Linux, Windows: a second start, which hands it over) or as open-url (macOS).
The app is made the system's handler of p-jol-roll:// only when it is packaged: a start from
the repository must not change the system's settings.
*/

export const SCHEME = "p-jol-roll";

// "p-jol-roll://act/DU/2026/1" -> "#act/DU/2026/1"; anything else -> undefined
export function hashOf(link) {
	const found = new RegExp(
		`^${SCHEME}://([a-z]+(?:/[A-Za-z]{1,16}/\\d{1,4}/\\d{1,7})?)/?$`,
	).exec(link ?? "");
	return found ? `#${found[1]}` : undefined;
}

export const linkIn = (argv) =>
	argv.find((one) => one.startsWith(`${SCHEME}://`));

export function handleLinks(open) {
	if (app.isPackaged) app.setAsDefaultProtocolClient(SCHEME);
	app.on("open-url", (event, link) => {
		event.preventDefault();
		open(hashOf(link));
	});
	app.on("second-instance", (_event, argv) => open(hashOf(linkIn(argv))));
}
