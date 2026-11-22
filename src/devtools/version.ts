// One version for the whole repository: the `version` of package.json.
//   node src/devtools/version.ts sync           every other version field written from it
//   node src/devtools/version.ts bump minor     X.Y.Z bumped (major, minor or patch), then sync - used by the workflows
//   node src/devtools/version.ts bump-commit    on a branch of .github/bos.json versioning.commits: the patch bumped, then sync
//   node src/devtools/version.ts merge O A B    git merge driver: the higher version of A and B, then a three-way merge
// As in the BOS core (`bos flow bump-commit`, `bos flow merge-version`), without needing `bos` installed.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { at, ROOT } from "../core/paths/at.ts"; // NOTE: i love that one! bring it to core for be used in future and import that `at` here. it can bbe declared in separed file

// ANSWER: done - src/core/paths/at.ts (with ROOT), used here, in init.ts and in src/cli/tasks.ts
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

// files that carry a copy of the version, and where in them it stands: what is before the
// version, the version between quotes, what is after (kept by $1 and $2 when it is written)
const QUOTED = String.raw`\s*")[^"]+(")`;
const field = (before: string, flags = "") =>
	new RegExp(`(${before}${QUOTED}`, flags);
// a project of uv: its pyproject.toml and the line of the project itself in uv.lock
const PYTHON = field(String.raw`^version\s*=`, "m");
const LOCKED =
	/(\nversion = ")[^"]+("\nsource = \{ (?:virtual|editable) = "\." \})/;
const COPIES: [string, RegExp][] = [
	["src/firefox-ext/manifest.json", field('"version":')],
	["src/openapi/spec.ts", field("version:")],
	["src/mcp/server.ts", field(String.raw`name:\s*"p-jol-roll",\s*version:`)],
	...["docs", "examples", "scripts"].flatMap((dir): [string, RegExp][] => [
		[`${dir}/pyproject.toml`, PYTHON],
		[`${dir}/uv.lock`, LOCKED],
	]),
];

// NOTE: patterns are repeatable and instead of multiple copies we can use reusable subpatterns of regexp - pattern `\s*")[^"]+(")/` is almost in every field of version checkers
// ANSWER: done - QUOTED is that part, field() builds a pattern of it; the python projects share theirs

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path: string, value: unknown) =>
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function parse(version: string) {
	const found = SEMVER.exec(version);
	if (!found) throw new Error(`not a version X.Y.Z: ${version}`);
	return found.slice(1).map(Number);
}

function higher(a: string, b: string) {
	const [x, y] = [parse(a), parse(b)];
	for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? a : b;
	return a;
}

// package.json, or package-lock.json (its root package too)
function setVersion(path: string, version: string) {
	const json = readJson(path);
	json.version = version;
	if (json.packages?.[""]) json.packages[""].version = version;
	writeJson(path, json);
}

function sync() {
	const { version } = readJson(at("package.json"));
	parse(version);
	setVersion(at("package-lock.json"), version);
	const changed = ["package-lock.json"];
	for (const [file, where] of COPIES) {
		let text: string;
		try {
			text = readFileSync(at(file), "utf8");
		} catch {
			continue;
		}
		if (!where.test(text)) throw new Error(`no version found in ${file}`);
		const next = text.replace(where, `$1${version}$2`);
		if (next !== text) writeFileSync(at(file), next);
		changed.push(file);
	}
	return { version, files: ["package.json", ...changed] };
}

const git = (...args: string[]) =>
	execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

// "dev/*" -> every branch that starts with "dev/"
const matches = (branch: string, pattern: string) =>
	pattern.endsWith("*")
		? branch.startsWith(pattern.slice(0, -1))
		: branch === pattern;

// X.Y.Z bumped by "major", "minor" or "patch", written and synced; the files it changed
function bump(kind: string) {
	const pkg = readJson(at("package.json"));
	const [x, y, z] = parse(pkg.version);
	pkg.version =
		kind === "major"
			? `${x + 1}.0.0`
			: kind === "minor"
				? `${x}.${y + 1}.0`
				: `${x}.${y}.${z + 1}`;
	writeJson(at("package.json"), pkg);
	return sync();
}

function bumpCommit() {
	const commits = readJson(at(".github/bos.json")).versioning?.commits ?? {};
	const branch = git("rev-parse", "--abbrev-ref", "HEAD");
	const patterns: string[] = commits.branches ?? [];
	if (!patterns.some((pattern) => matches(branch, pattern))) {
		console.log(`version: ${branch} does not bump`);
		return;
	}
	const kind = commits.bump ?? "patch";
	const { version, files } = bump(kind);
	git("add", "--", ...files);
	console.log(`version: ${version} (${kind} of ${branch})`);
}

// git calls it with the ancestor, ours (the result goes here) and theirs
function merge(base: string, ours: string, theirs: string) {
	const version = higher(
		readJson(ours).version ?? "0.0.0",
		readJson(theirs).version ?? "0.0.0",
	);
	for (const path of [base, ours, theirs]) {
		try {
			setVersion(path, version);
		} catch {
			// an ancestor that is not JSON (or empty): the three-way merge decides
		}
	}
	try {
		execFileSync("git", ["merge-file", ours, base, theirs]);
	} catch {
		process.exit(1);
	}
}

const [command, ...args] = process.argv.slice(2);
if (command === "sync") {
	const { version, files } = sync();
	console.log(`version: ${version} in ${files.join(", ")}`);
} else if (command === "bump-commit") bumpCommit();
else if (command === "bump" && ["major", "minor", "patch"].includes(args[0])) {
	const { version, files } = bump(args[0]);
	console.log(`version: ${version} in ${files.join(", ")}`);
} else if (command === "merge" && args.length === 3)
	merge(args[0], args[1], args[2]);
else {
	console.error(
		"usage: version.ts sync | bump major|minor|patch | bump-commit | merge <base> <ours> <theirs>",
	);
	process.exit(2);
}
