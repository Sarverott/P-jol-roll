import { BrowserWindow } from "electron";

/*
A small window while the api starts and reads what is gathered - a big dataset takes a few
seconds - closed when the viewer is ready.
*/

const PAGE = `<!doctype html><meta charset="utf-8"><title>P_JOL_ROLL</title>
<body style="margin:0;display:grid;place-items:center;height:100vh;background:#1d2440;color:#f3efe4;font:15px system-ui,sans-serif">
<div style="text-align:center"><h1 style="margin:0 0 .4rem;letter-spacing:.05em">P_JOL_ROLL</h1>
<p style="margin:0;opacity:.8">starting the api and reading what is gathered...</p></div></body>`;

export function showLoading({ show = true } = {}) {
	const modal = new BrowserWindow({
		width: 420,
		height: 180,
		frame: false,
		resizable: false,
		show,
		webPreferences: { contextIsolation: true, sandbox: true },
	});
	modal.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(PAGE)}`);
	return () => {
		if (!modal.isDestroyed()) modal.close();
	};
}
