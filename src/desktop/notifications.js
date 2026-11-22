import { Notification } from "electron";
import { io } from "socket.io-client";

/*
A notice of the system when files of the dataset change on this machine (task gather, task
compile...), as the api tells the viewer over socket.io; a click brings the window up. The
viewer shows the same notice inside.
*/

export function notifyChanges(address, showWindow) {
	if (!Notification.isSupported()) return () => {};
	const socket = io(address, { reconnectionAttempts: 3 });
	socket.on("changed", (paths) => {
		const notice = new Notification({
			title: "P_JOL_ROLL",
			body: `${paths.length} files of the dataset changed`,
			silent: true,
		});
		notice.on("click", showWindow);
		notice.show();
	});
	return () => socket.close();
}
