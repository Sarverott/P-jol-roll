import { app, dialog } from "electron";

// what the app says in a box of the system: a failure that ends it, and what it is

export function failure(error) {
	dialog.showErrorBox(
		"P_JOL_ROLL could not start",
		`${error.message}\n\nBuild the website first (task web:build), then start it again (task desktop).`,
	);
}

export function about(window) {
	return dialog.showMessageBox(window, {
		type: "info",
		title: "About P_JOL_ROLL",
		message: `P_JOL_ROLL ${app.getVersion()}`,
		detail:
			"Every act of the Polish journals of laws, gathered in the open - read it, follow its ties, search it.\nNot (formally) legal advices: the journal published by the state is the law.\nOpen source, AGPL-3.0-only: https://github.com/Sarverott/P-jol-roll",
	});
}
