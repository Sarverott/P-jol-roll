// The state of the project for the page, counted from the same files as the MkDocs hook
// (docs/_mkdocs/project.py): phases of docs/devlog/TODO.md and marks of docs/guides/features.md,
// with the version of package.json. Written to src/state.json, which the page imports; and the
// lists of the page (src/data/*.yaml: links, sources, ways) into src/lists.json beside it.
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const root = new URL("../../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");

const phases = [];
for (const line of read("docs/devlog/TODO.md").split("\n")) {
	const head = /^## Phase (\d+): (.+)$/.exec(line);
	if (head)
		phases.push({ n: Number(head[1]), title: head[2], done: 0, all: 0 });
	const item = /^- \[([ x])\] /.exec(line);
	if (item && phases.length) {
		phases.at(-1).all++;
		if (item[1] === "x") phases.at(-1).done++;
	}
}

const features = { works: 0, built: 0, wanted: 0 };
for (const line of read("docs/guides/features.md").split("\n")) {
	const cells = line
		.trim()
		.replace(/^\||\|$/g, "")
		.split("|")
		.map((cell) => cell.trim());
	if (cells.length !== 3) continue;
	for (const mark of Object.keys(features))
		if (cells[2].startsWith(`**${mark}**`)) features[mark]++;
}

const { version } = JSON.parse(read("package.json"));
const state = { version, phases, features };
writeFileSync(
	new URL("../src/state.json", import.meta.url),
	`${JSON.stringify(state, null, "\t")}\n`,
);
console.log(
	`state: v${version}, ${phases.length} phases, ${features.works} functions working`,
);

// the lists of the page, kept as yaml, handed to it as plain JSON
const lists = Object.fromEntries(
	["links", "sources", "ways"].map((name) => [
		name,
		parse(read(`webpage/src/data/${name}.yaml`)),
	]),
);
writeFileSync(
	new URL("../src/lists.json", import.meta.url),
	`${JSON.stringify(lists, null, "\t")}\n`,
);
