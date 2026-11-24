import { verify as check, createHash, createPublicKey } from "node:crypto";
import type { ReadingScope } from "../vars/interfaces/index.js";

/*
A file signed with a FIDO key (phase 40, Q17) checked with nothing but the file and its
signature: the key signed, by WebAuthn, the file's sha256 as the challenge. What is checked:
  the file's sha256 is the one signed
  the client's data is an assertion (webauthn.get) whose challenge is that sha256
  the authenticator's data is for the relying party named, with the user present
  the signature over authenticatorData + sha256(clientDataJSON) is the key's
The key's fingerprint (sha256 of its public part) says whose it is - the person compares it with
the one their app showed when they registered the key. Not a qualified electronic signature.
*/

const fromBase64url = (text: string) => Buffer.from(text, "base64url");
const sha256 = (data: Buffer | string) =>
	createHash("sha256").update(data).digest();

export const fingerprintOf = (publicKey: string) =>
	sha256(Buffer.from(publicKey, "base64"))
		.toString("hex")
		.match(/.{4}/g)
		?.join(":") ?? "";

export function verify(file: Buffer, signature: ReadingScope.Signature) {
	const wrong: string[] = [];
	const digest = sha256(file);
	if (signature.format !== "p-jol-roll-signature/1")
		wrong.push(`not a signature of the project: ${signature.format}`);
	if (digest.toString("hex") !== signature.sha256)
		wrong.push("the file is not the one signed: its sha256 differs");
	let client: { type?: string; challenge?: string; origin?: string } = {};
	try {
		client = JSON.parse(
			fromBase64url(signature.clientDataJSON).toString("utf8"),
		);
	} catch {
		wrong.push("the client's data is not JSON");
	}
	if (client.type !== "webauthn.get")
		wrong.push(`not an assertion: ${client.type}`);
	if (client.challenge !== digest.toString("base64url"))
		wrong.push("the key signed another challenge than the file's sha256");
	const authenticator = fromBase64url(signature.authenticatorData);
	if (authenticator.length < 37)
		wrong.push("the authenticator's data is too short");
	else {
		if (!authenticator.subarray(0, 32).equals(sha256(signature.rpId)))
			wrong.push(`signed for another relying party than ${signature.rpId}`);
		if (!(authenticator[32] & 0x01)) wrong.push("the user was not present");
	}
	let valid = false;
	try {
		const key = createPublicKey({
			key: Buffer.from(signature.key.publicKey, "base64"),
			format: "der",
			type: "spki",
		});
		const signed = Buffer.concat([
			authenticator,
			sha256(fromBase64url(signature.clientDataJSON)),
		]);
		const hash = signature.key.algorithm === -8 ? null : "sha256";
		valid = check(hash, signed, key, fromBase64url(signature.signature));
	} catch (error) {
		wrong.push(
			`the key or the signature is broken: ${(error as Error).message}`,
		);
	}
	if (!valid) wrong.push("the signature is not the key's");
	return {
		valid: wrong.length === 0,
		wrong,
		key: signature.key.name,
		fingerprint: fingerprintOf(signature.key.publicKey),
		signedAt: signature.signedAt,
		origin: client.origin ?? "",
		counter: authenticator.length >= 37 ? authenticator.readUInt32BE(33) : 0,
	};
}
