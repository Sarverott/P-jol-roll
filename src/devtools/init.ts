// First launch of the project on a machine: `task init` (phase 7 of the devlog).
//   - checks what is installed: what is needed stops it, what is optional is only named
//   - copies .env.example to .env when there is no .env
//   - generates the secrets of the services into resources/secrets/, one file each, never overwriting
// Writes resources/.containerdatavol/init/done at the end; the task skips itself after that
// (`task init -f` runs it again). Nothing here asks the internet.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { at } from "../core/paths/at.ts";

// secrets the services of resources/services/ need, by file name
const SECRETS: string[] = [
	"litellm_master_key", // llms-api-host (profile llms)
	"typesense_api_key", // typesense (profile search)
];

// [command, arguments, needed, what for]
const TOOLS: [string, string[], boolean, string][] = [
	["node", ["--version"], true, "everything (24 or newer)"],
	["npm", ["--version"], true, "dependencies (11 or newer)"],
	["git", ["--version"], true, "the repository"],
	[
		"docker",
		["--version"],
		false,
		"the services (compose.yaml) and tests/unittesting",
	],
	["uv", ["--version"], false, "the website of the project (task docs:build)"],
];

const major = (version: string) => Number(/(\d+)\./.exec(version)?.[1] ?? 0);

let missing = 0;
for (const [command, args, needed, purpose] of TOOLS) {
	let version = "";
	try {
		version = execFileSync(command, args, { encoding: "utf8" }).trim();
	} catch {}
	const tooOld =
		(command === "node" && version && major(version.slice(1)) < 24) ||
		(command === "npm" && version && major(version) < 11);
	if (version && !tooOld) console.log(`ok       ${command} ${version}`);
	else {
		const state = version ? `too old (${version})` : "not found";
		console.log(
			`${needed ? "missing " : "optional"} ${command} ${state} - for ${purpose}`,
		);
		if (needed) missing++;
	}
}
if (missing) {
	console.error(`init: ${missing} needed tool(s) missing, nothing else done`);
	process.exit(1);
}

if (existsSync(at(".env"))) console.log("kept     .env");
else {
	copyFileSync(at(".env.example"), at(".env"));
	console.log("made     .env from .env.example - fill in the tokens you have");
}

mkdirSync(at("resources/secrets"), { recursive: true });
for (const name of SECRETS) {
	const file = at(`resources/secrets/${name}`);
	if (existsSync(file)) console.log(`kept     resources/secrets/${name}`);
	else {
		writeFileSync(file, randomBytes(32).toString("base64url"), { mode: 0o600 });
		console.log(`made     resources/secrets/${name}`);
	}
}

mkdirSync(at("resources/.containerdatavol/init"), { recursive: true });
writeFileSync(
	at("resources/.containerdatavol/init/done"),
	`${new Date().toISOString()}\n`,
);
console.log("init: done - task help lists what can be run");
