/*
The person's devices, as the desktop app asks the window to reach them (phase 40, Q17): the
browser's own WebAuthn and Web Bluetooth, which only a page can call. The app's main process
(src/desktop/devices.js) calls window.pjrDevices through executeJavaScript, after the person
chose an item of a menu; a website never calls them.
  register(name)          a FIDO key (USB HID) registered: its id and the public part of it
  sign(sha256, keys)      the key signs a file's sha256 (the challenge), as a WebAuthn assertion
  printLabel(bytes)       ESC/POS bytes sent to a Bluetooth sticker printer the person picks
The relying party is the page's host: "localhost" in the app (WebAuthn takes no IP address).
*/

const base64url = (buffer) =>
	btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
const fromBase64url = (text) =>
	Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (sign) =>
		sign.charCodeAt(0),
	);
const fromHex = (hex) =>
	Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));

export async function register(name) {
	const credential = await navigator.credentials.create({
		publicKey: {
			rp: { id: location.hostname, name: "P_JOL_ROLL" },
			user: {
				id: crypto.getRandomValues(new Uint8Array(16)),
				name,
				displayName: name,
			},
			challenge: crypto.getRandomValues(new Uint8Array(32)),
			// ES256 first: every FIDO2 key has it; EdDSA and RS256 for the others
			pubKeyCredParams: [-7, -8, -257].map((alg) => ({
				type: "public-key",
				alg,
			})),
			authenticatorSelection: {
				authenticatorAttachment: "cross-platform",
				residentKey: "discouraged",
				userVerification: "discouraged",
			},
			attestation: "none",
			timeout: 120000,
		},
	});
	return {
		name,
		id: credential.id,
		publicKey: btoa(
			String.fromCharCode(
				...new Uint8Array(credential.response.getPublicKey()),
			),
		),
		algorithm: credential.response.getPublicKeyAlgorithm(),
		rpId: location.hostname,
	};
}

export async function sign(sha256, keys) {
	const assertion = await navigator.credentials.get({
		publicKey: {
			challenge: fromHex(sha256),
			rpId: location.hostname,
			allowCredentials: keys.map((key) => ({
				type: "public-key",
				id: fromBase64url(key.id),
			})),
			userVerification: "discouraged",
			timeout: 120000,
		},
	});
	const { name, id, publicKey, algorithm } =
		keys.find((key) => key.id === assertion.id) ?? {};
	return {
		format: "p-jol-roll-signature/1",
		sha256,
		rpId: location.hostname,
		key: { name, id, publicKey, algorithm },
		authenticatorData: base64url(assertion.response.authenticatorData),
		clientDataJSON: base64url(assertion.response.clientDataJSON),
		signature: base64url(assertion.response.signature),
	};
}

// the services thermal printers write ESC/POS to over Bluetooth Low Energy (the common ones)
export const PRINTER_SERVICES = [
	0x18f0,
	"e7810a71-73ae-499d-8c15-faa9aef0c3f2",
	"49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

export async function printLabel(bytes) {
	const device = await navigator.bluetooth.requestDevice({
		acceptAllDevices: true,
		optionalServices: PRINTER_SERVICES,
	});
	const server = await device.gatt.connect();
	try {
		for (const service of await server.getPrimaryServices()) {
			for (const characteristic of await service.getCharacteristics()) {
				const { write, writeWithoutResponse } = characteristic.properties;
				if (!write && !writeWithoutResponse) continue;
				// small pieces: printers take a few hundred bytes at a time
				for (let at = 0; at < bytes.length; at += 180) {
					const piece = Uint8Array.from(bytes.slice(at, at + 180));
					if (writeWithoutResponse)
						await characteristic.writeValueWithoutResponse(piece);
					else await characteristic.writeValueWithResponse(piece);
				}
				return { printer: device.name ?? device.id, bytes: bytes.length };
			}
		}
		throw new Error(`${device.name ?? "the device"} takes no writing`);
	} finally {
		server.disconnect();
	}
}

export function offerDevices() {
	window.pjrDevices = { register, sign, printLabel };
}
