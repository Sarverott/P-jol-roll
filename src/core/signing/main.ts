import { readFileSync } from "node:fs";
import type { ReadingScope } from "../vars/interfaces/index.js";
import { verify } from "./verify.js";

/*
task sign:verify -- <file> [<file>.sig.json]: a file signed by the desktop app with a FIDO key
(phase 40) checked against its signature, offline.
*/

const [file, given] = process.argv.slice(2);
if (!file) {
	console.error(
		"a file: task sign:verify -- act.pdf   (its signature act.pdf.sig.json beside it)",
	);
	process.exit(2);
}
const signature = JSON.parse(
	readFileSync(given ?? `${file}.sig.json`, "utf8"),
) as ReadingScope.Signature;
const result = verify(readFileSync(file), signature);
console.log(
	result.valid
		? `signed: ${file}\n  by the key "${result.key}", fingerprint ${result.fingerprint}\n  at ${result.signedAt}, in ${result.origin} (the key's counter ${result.counter})\n  Compare the fingerprint with the one the app showed when the key was registered.`
		: `NOT VALID: ${file}\n  ${result.wrong.join("\n  ")}`,
);
process.exit(result.valid ? 0 : 1);
