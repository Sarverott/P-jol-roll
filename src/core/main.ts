// For more information, see https://crawlee.dev/

import { parseArgs } from "node:util";
import { PARTS } from "./apihandlers/eli.js";
import type { GatheringScope as GatheringTypes } from "./vars/types/index.js";

/*
### usage - npm start -- {command} ..., command "gather" can be left out

gather                               -> lists of API and metadata of the newest year, every journal
gather 2025 2026                     -> metadata of these years
gather --all                         -> metadata of every year
gather 2026 --acts --limit 5         -> and all files of first 5 acts that miss any
gather 2026 --parts pdf,html         -> only these files (details, references, pdf, html, struct, texts)
gather --publisher MP                -> one journal (DU, MP), can be repeated
gather --all --acts --limit 0        -> everything that API has
gather --since 2026-10-01            -> acts changed since that day: listings, details and references again
gather --since last --acts           -> since the previous such run, with all files that can change

seal                                 -> write checksums of gathered files that have no record yet
seal --check                         -> read every recorded file again and name these that differ
compile                              -> tables of dataset from raw files: details and references of acts
text                                 -> markdown from gathered html, with checksums of both

sejm                                 -> work of Sejm: processes and prints of the current term
sejm 9 10 --files --limit 50         -> these terms, with details of processes and files of prints
saos 2024 2025 --limit 3             -> court judgments of these years, 3 months that are not here yet

checkup 2026 --limit 6               -> browser visits websites that show acts of gathered year
checkup 2026 --frontend eli          -> only one of resources/frontends.json
checkup 2026 --headless              -> without window

hub plan dataset                     -> what differs between resources/dataset and huggingface
hub pull dataset                     -> take what is missing here
hub push dataset                     -> send what is new or changed here (HF_TOKEN)
*/
const COMMANDS = [
	"gather",
	"seal",
	"compile",
	"text",
	"sejm",
	"saos",
	"checkup",
	"hub",
];
const [first = "", ...rest] = process.argv.slice(2);
const command = COMMANDS.includes(first) ? first : "gather";
const args = command === first ? rest : process.argv.slice(2);

const { values, positionals } = parseArgs({
	args,
	allowPositionals: true,
	options: {
		publisher: { type: "string", multiple: true, default: [] },
		all: { type: "boolean", default: false },
		acts: { type: "boolean", default: false },
		parts: { type: "string", default: "" },
		limit: { type: "string" },
		rate: { type: "string" },
		frontend: { type: "string", multiple: true, default: [] },
		headless: { type: "boolean", default: false },
		batch: { type: "string", default: "100" },
		since: { type: "string" },
		check: { type: "boolean", default: false },
		files: { type: "boolean", default: false },
	},
});

if (command === "gather") {
	const asked = values.parts
		.split(",")
		.filter(Boolean) as GatheringTypes.Part[];
	const unknown = asked.filter((part) => !PARTS.includes(part));
	if (unknown.length) throw new Error(`unknown parts: ${unknown}`);

	const { gather } = await import("./methods/gather.js");
	await gather({
		publishers: values.publisher,
		years: positionals.map(Number),
		all: values.all,
		parts: asked.length ? asked : values.acts ? [...PARTS] : [],
		limit: Number(values.limit ?? 20),
		rate: Number(values.rate ?? 120),
		since: values.since,
	});
}

if (command === "seal") {
	const { seal, check } = await import("./methods/seal.js");
	if (values.check) {
		const { same, differs } = await check();
		console.log(
			`${same} files are what was recorded, ${differs.length} differ`,
		);
		for (const path of differs) console.log(path);
		if (differs.length) process.exitCode = 1;
	} else console.log(`${await seal()} records added`);
}

if (command === "compile") {
	const { compile } = await import("./methods/compile.js");
	console.log(await compile());
}

if (command === "text") {
	const { text } = await import("./parsing/text.js");
	console.log(await text());
}

if (command === "sejm") {
	const { sejm } = await import("./apihandlers/sejm.js");
	await sejm({
		terms: positionals.map(Number),
		all: values.all,
		files: values.files,
		limit: Number(values.limit ?? 20),
		rate: Number(values.rate ?? 120),
	});
}

if (command === "saos") {
	if (!positionals.length) throw new Error("saos needs years: saos 2025");
	const { saos } = await import("./apihandlers/saos.js");
	await saos({
		years: positionals.map(Number),
		limit: Number(values.limit ?? 3),
		// not a server of the state - asked more slowly
		rate: Number(values.rate ?? 30),
	});
}

if (command === "checkup") {
	if (!positionals.length) throw new Error("checkup needs years: checkup 2026");

	const { checkup } = await import("./methods/checkup.js");
	await checkup({
		publishers: values.publisher.length ? values.publisher : ["DU"],
		years: positionals.map(Number),
		frontends: values.frontend,
		limit: Number(values.limit ?? 10),
		headless: values.headless,
	});
}

if (command === "hub") {
	const [action, name = ""] = positionals;
	const hub = await import("./resources/hub.js");

	if (action === "plan") {
		const { repo, upload, changed, download, same } = await hub.plan(name);
		console.log(`${repo}: ${same} files are the same`);
		for (const [title, paths] of Object.entries({ upload, changed, download }))
			console.log(`${title} ${paths.length}`, paths.slice(0, 10));
	} else if (action === "push") await hub.push(name, Number(values.batch));
	else if (action === "pull") await hub.pull(name);
	else throw new Error("hub needs action: plan, pull or push");
}
