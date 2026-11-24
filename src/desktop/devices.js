import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { userInfo } from "node:os";
import { join } from "node:path";
import { app, BrowserWindow, dialog, Menu } from "electron";
import QRCode from "qrcode";
import { label } from "./labels.js";

/*
The person's devices (phase 40, Q17), offered by the menus of the window, the tray and the app:
  a FIDO key (USB HID, WebAuthn): registered once - its public part kept in the app's own
    folder (signing-keys.json) - then a PDF of what the window shows signed with it: the PDF and
    <name>.pdf.sig.json beside it, verified by anyone with task sign:verify
  a sticker printer over Bluetooth: a label of the act shown (ELI, title, a QR code of its address)
    in ESC/POS (labels.js), sent to the printer the person picks
  a phone: the act's address on the demo as a QR code, for the phone's camera - Web Bluetooth
    cannot hand a file to a phone
WebAuthn and Web Bluetooth live in the page (src/gui/assets/devices.js); the window loads
http://localhost:<port> because WebAuthn takes no IP address. Not a qualified signature.
*/

const DEMO = "https://sarverott-docs-of-law-by-gov-in-poland.hf.space";
const keysFile = () => join(app.getPath("userData"), "signing-keys.json");
const fingerprint = (publicKey) =>
	createHash("sha256")
		.update(Buffer.from(publicKey, "base64"))
		.digest("hex")
		.match(/.{4}/g)
		.join(":");

async function keys() {
	try {
		return JSON.parse(await readFile(keysFile(), "utf8"));
	} catch {
		return [];
	}
}

const inPage = (window, call) =>
	window.webContents.executeJavaScript(call, true).catch((error) => {
		throw new Error(String(error?.message ?? error));
	});

const tell = (window, message, detail = "") =>
	dialog.showMessageBox(window, {
		type: "info",
		title: "P_JOL_ROLL",
		message,
		detail,
	});

export async function registerKey(window) {
	if (!window) return;
	const name = `${userInfo().username}, ${new Date().toISOString().slice(0, 10)}`;
	try {
		await tell(
			window,
			"Touch your security key when it blinks.",
			"It is registered for signing in this app.",
		);
		const key = await inPage(
			window,
			`window.pjrDevices.register(${JSON.stringify(name)})`,
		);
		const all = [...(await keys()).filter((one) => one.id !== key.id), key];
		await writeFile(keysFile(), `${JSON.stringify(all, null, "\t")}\n`);
		await tell(
			window,
			`The key "${name}" is registered.`,
			`Its fingerprint - compare it when you verify a signature:\n${fingerprint(key.publicKey)}`,
		);
	} catch (error) {
		dialog.showErrorBox(
			"P_JOL_ROLL",
			`The key was not registered: ${error.message}`,
		);
	}
}

// the act the window shows, as #act/DU/2026/1
async function shownAct(window) {
	const hash = await window.webContents.executeJavaScript("location.hash");
	return /^#act\/((?:DU|MP)\/\d{4}\/\d+)/.exec(hash)?.[1];
}

export async function signPdf(window) {
	if (!window) return;
	const registered = await keys();
	if (!registered.length) {
		const { response } = await dialog.showMessageBox(window, {
			type: "question",
			buttons: ["Register a key", "Cancel"],
			message: "No security key is registered for signing yet.",
		});
		if (response === 0) await registerKey(window);
		return;
	}
	const eli = await shownAct(window);
	const { canceled, filePath } = await dialog.showSaveDialog(window, {
		defaultPath: `${eli ? eli.replace(/\//g, "-") : "P_JOL_ROLL"}.pdf`,
		filters: [{ name: "PDF", extensions: ["pdf"] }],
	});
	if (canceled || !filePath) return;
	try {
		const pdf = await window.webContents.printToPDF({});
		const sha256 = createHash("sha256").update(pdf).digest("hex");
		const made = await inPage(
			window,
			`window.pjrDevices.sign(${JSON.stringify(sha256)}, ${JSON.stringify(registered)})`,
		);
		const signature = {
			...made,
			file: filePath.split(/[/\\]/).at(-1),
			signedAt: new Date().toISOString(),
		};
		await writeFile(filePath, pdf);
		await writeFile(
			`${filePath}.sig.json`,
			`${JSON.stringify(signature, null, "\t")}\n`,
		);
		await tell(
			window,
			`Signed by "${signature.key.name}".`,
			`${filePath}\n${filePath}.sig.json\n\nVerify: task sign:verify -- "${filePath}"\nThe key's fingerprint: ${fingerprint(signature.key.publicKey)}`,
		);
	} catch (error) {
		dialog.showErrorBox("P_JOL_ROLL", `Not signed: ${error.message}`);
	}
}

export async function printLabel(window, address) {
	if (!window) return;
	const eli = await shownAct(window);
	if (!eli) return tell(window, "Open an act first: its label is printed.");
	try {
		const answer = await fetch(`${address}/api/acts/${eli}`);
		const title = answer.ok ? (await answer.json()).act?.title : eli;
		const bytes = label({ eli, title, url: `${DEMO}/#act/${eli}` });
		const done = await inPage(
			window,
			`window.pjrDevices.printLabel(${JSON.stringify(bytes)})`,
		);
		await tell(window, `The label of ${eli} went to ${done.printer}.`);
	} catch (error) {
		dialog.showErrorBox("P_JOL_ROLL", `Not printed: ${error.message}`);
	}
}

export async function showForPhone(window) {
	if (!window) return;
	const eli = await shownAct(window);
	const url = eli ? `${DEMO}/#act/${eli}` : DEMO;
	const image = await QRCode.toDataURL(url, { width: 360, margin: 2 });
	const shown = new BrowserWindow({
		parent: window,
		width: 420,
		height: 500,
		title: eli ?? "P_JOL_ROLL",
		webPreferences: {
			sandbox: true,
			contextIsolation: true,
			javascript: false,
		},
	});
	shown.setMenuBarVisibility(false);
	const page = `<!doctype html><meta charset="utf-8"><title>${eli ?? "P_JOL_ROLL"}</title><body style="margin:0;text-align:center;font:14px sans-serif"><img src="${image}" alt="QR"><p>${eli ?? "P_JOL_ROLL"}: scan it with the phone's camera</p></body>`;
	shown.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`);
}

// Electron shows no chooser of Bluetooth devices: the devices found in a few seconds, as a menu
export function chooseBluetooth(window) {
	let found = [];
	let timer;
	window.webContents.on("select-bluetooth-device", (event, devices, choose) => {
		event.preventDefault();
		found = devices;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (!found.length) {
				choose("");
				dialog.showErrorBox(
					"P_JOL_ROLL",
					"No Bluetooth device found: is the printer on and near?",
				);
				return;
			}
			Menu.buildFromTemplate([
				...found.map((device) => ({
					label: device.deviceName || device.deviceId,
					click: () => choose(device.deviceId),
				})),
				{ type: "separator" },
				{ label: "Cancel", click: () => choose("") },
			]).popup({ window });
		}, 4000);
	});
}
