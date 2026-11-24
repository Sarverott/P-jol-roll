import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { verify } from "../src/core/signing/verify.js";
import type { ReadingScope } from "../src/core/vars/interfaces/index.js";

// signing with a FIDO key (phase 40): the verifier against assertions made here, then the
// browser's own WebAuthn with a security key simulated by Chromium (CDP's virtual authenticator)

const sha256 = (data: Buffer | string) =>
	createHash("sha256").update(data).digest();
const file = Buffer.from("%PDF-1.7 the act as printed");

// an assertion as a key makes it: authenticatorData (rpIdHash, flags, counter), clientDataJSON
function assertion(
	content: Buffer,
	{ rpId = "localhost", flags = 0x01, ed = false } = {},
): ReadingScope.Signature {
	const keys = ed
		? generateKeyPairSync("ed25519")
		: generateKeyPairSync("ec", { namedCurve: "P-256" });
	const authenticator = Buffer.concat([
		sha256(rpId),
		Buffer.from([flags]),
		Buffer.from([0, 0, 0, 7]),
	]);
	const client = Buffer.from(
		JSON.stringify({
			type: "webauthn.get",
			challenge: sha256(content).toString("base64url"),
			origin: "http://localhost:8080",
		}),
	);
	const signed = Buffer.concat([authenticator, sha256(client)]);
	return {
		format: "p-jol-roll-signature/1",
		file: "act.pdf",
		sha256: sha256(content).toString("hex"),
		signedAt: "2026-11-24T14:00:00Z",
		rpId: "localhost",
		key: {
			name: "a key",
			id: "aWQ",
			publicKey: keys.publicKey
				.export({ format: "der", type: "spki" })
				.toString("base64"),
			algorithm: ed ? -8 : -7,
		},
		authenticatorData: authenticator.toString("base64url"),
		clientDataJSON: client.toString("base64url"),
		signature: sign(ed ? null : "sha256", signed, keys.privateKey).toString(
			"base64url",
		),
	};
}

test("a signature is checked against the file, the challenge, the party and the key", () => {
	const good = verify(file, assertion(file));
	expect(good).toMatchObject({ valid: true, counter: 7, key: "a key" });
	expect(good.fingerprint).toMatch(/^([0-9a-f]{4}:){15}[0-9a-f]{4}$/);
	expect(verify(file, assertion(file, { ed: true })).valid).toBe(true);

	const changed = verify(Buffer.from("%PDF-1.7 another"), assertion(file));
	expect(changed.valid).toBe(false);
	expect(changed.wrong[0]).toMatch(/not the one signed/);
	expect(verify(file, assertion(file, { rpId: "evil.example" })).wrong).toEqual(
		[expect.stringMatching(/another relying party/)],
	);
	expect(verify(file, assertion(file, { flags: 0 })).wrong).toEqual([
		"the user was not present",
	]);
	// another key's public part: the signature is not its
	const forged = { ...assertion(file), key: assertion(file).key };
	expect(verify(file, forged).wrong).toContain(
		"the signature is not the key's",
	);
});

// the headless shell playwright keeps, as the collector of translations finds it
function chromiumShell() {
	if (process.env.CHROMIUM) return process.env.CHROMIUM;
	const cache = join(homedir(), ".cache", "ms-playwright");
	if (!existsSync(cache)) return undefined;
	const shell = readdirSync(cache)
		.filter((name) => name.startsWith("chromium_headless_shell-"))
		.sort()
		.at(-1);
	const path =
		shell &&
		join(
			cache,
			shell,
			"chrome-headless-shell-linux64",
			"chrome-headless-shell",
		);
	return path && existsSync(path) ? path : undefined;
}

test.skipIf(!chromiumShell())(
	"the window registers a key and signs a file's sha256 by WebAuthn, the signature verifies",
	async () => {
		const devices = readFileSync(
			join(import.meta.dirname, "..", "src/gui/assets/devices.js"),
			"utf8",
		);
		const server = createServer((request, response) => {
			if (request.url === "/devices.js") {
				response.setHeader("content-type", "text/javascript");
				response.end(devices);
			} else {
				response.setHeader("content-type", "text/html");
				response.end(
					'<script type="module">import { offerDevices } from "/devices.js"; offerDevices(); window.ready = true;</script>',
				);
			}
		});
		await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
		const { chromium } = await import("playwright");
		const browser = await chromium.launch({ executablePath: chromiumShell() });
		try {
			const page = await browser.newPage();
			// a security key on USB, present, with no PIN asked - what Chromium simulates
			const cdp = await page.context().newCDPSession(page);
			await cdp.send("WebAuthn.enable");
			await cdp.send("WebAuthn.addVirtualAuthenticator", {
				options: {
					protocol: "ctap2",
					transport: "usb",
					hasResidentKey: false,
					hasUserVerification: false,
					automaticPresenceSimulation: true,
				},
			});
			// localhost: WebAuthn takes no IP address as its relying party, so the app's window uses it
			await page.goto(
				`http://localhost:${(server.address() as AddressInfo).port}/`,
			);
			await page.waitForFunction(() => (window as { ready?: boolean }).ready);
			const key = await page.evaluate(() =>
				(
					window as unknown as {
						pjrDevices: { register: (name: string) => Promise<unknown> };
					}
				).pjrDevices.register("the owner's key"),
			);
			expect(key).toMatchObject({
				name: "the owner's key",
				algorithm: -7,
				rpId: "localhost",
			});
			const made = (await page.evaluate(
				([hash, keys]) =>
					(
						window as unknown as {
							pjrDevices: {
								sign: (hash: string, keys: unknown[]) => Promise<unknown>;
							};
						}
					).pjrDevices.sign(hash as string, keys as unknown[]),
				[sha256(file).toString("hex"), [key]],
			)) as ReadingScope.Signature;
			const signature = {
				...made,
				file: "act.pdf",
				signedAt: new Date().toISOString(),
			};
			const result = verify(file, signature);
			expect(result.wrong).toEqual([]);
			expect(result.valid).toBe(true);
			expect(result.origin).toMatch(/^http:\/\/localhost:/);
			expect(verify(Buffer.from("another file"), signature).valid).toBe(false);
		} finally {
			await browser.close();
			server.close();
		}
	},
	60_000,
);
