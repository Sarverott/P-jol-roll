// a file signed with a FIDO key (phase 40, Q17): <file>.sig.json beside it - a WebAuthn assertion
// over the file's sha256, with the key's public part, so it is verified with nothing else
export default interface Signature {
	format: "p-jol-roll-signature/1";
	file: string; // its name when signed
	sha256: string; // of the file, hex - the challenge the key signed
	signedAt: string;
	rpId: string; // the WebAuthn relying party: "localhost" in the desktop app
	key: {
		name: string; // as the person named it when registering it
		id: string; // the credential's id, base64url
		publicKey: string; // SubjectPublicKeyInfo, DER, base64
		algorithm: number; // COSE: -7 ES256, -8 EdDSA, -257 RS256
	};
	authenticatorData: string; // base64url
	clientDataJSON: string; // base64url
	signature: string; // base64url
}
