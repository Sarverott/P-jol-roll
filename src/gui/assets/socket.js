import { io } from "socket.io-client";

/*
Notices of the api over socket.io (src/openapi): "changed" when files of the dataset change
on the host, with their paths. A host without socket.io (a static copy) is tried three times,
then left alone.
*/
// NOTE: hold on! move all socket-io functionalities to separed file in assets with functions later on imported here
// ANSWER: done - the viewer calls listen() and gets back the way to close

export function listen(api, { changed }) {
	const socket = io(api || undefined, { reconnectionAttempts: 3 });
	socket.on("changed", changed);
	return () => socket.close();
}
