// For more information, see https://crawlee.dev/
import { parseArgs } from "node:util";
import { PARTS, type Part } from "./eli.js";

/*
### usage - npm start -- {command} ..., command "gather" can be left out

gather                               -> lists of API and metadata of the newest year, every journal
gather 2025 2026                     -> metadata of these years
gather --all                         -> metadata of every year
gather 2026 --acts --limit 5         -> and all files of first 5 acts that miss any
gather 2026 --parts pdf,html         -> only these files (details, references, pdf, html)
gather --publisher MP                -> one journal (DU, MP), can be repeated
gather --all --acts --limit 0        -> everything that API has

checkup 2026 --limit 6               -> browser visits websites that show acts of gathered year
checkup 2026 --frontend eli          -> only one of resources/frontends.json
checkup 2026 --headless              -> without window

hub plan dataset                     -> what differs between resources/dataset and huggingface
hub pull dataset                     -> take what is missing here
hub push dataset                     -> send what is new or changed here (HF_TOKEN)
*/
const COMMANDS = ["gather", "checkup", "hub"];
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
		rate: { type: "string", default: "120" },
		frontend: { type: "string", multiple: true, default: [] },
		headless: { type: "boolean", default: false },
		batch: { type: "string", default: "100" },
	},
});

if (command === "gather") {
	const asked = values.parts.split(",").filter(Boolean) as Part[];
	const unknown = asked.filter((part) => !PARTS.includes(part));
	if (unknown.length) throw new Error(`unknown parts: ${unknown}`);

	const { gather } = await import("./gather.js");
	await gather({
		publishers: values.publisher,
		years: positionals.map(Number),
		all: values.all,
		parts: asked.length ? asked : values.acts ? [...PARTS] : [],
		limit: Number(values.limit ?? 20),
		rate: Number(values.rate),
	});
}

if (command === "checkup") {
	if (!positionals.length) throw new Error("checkup needs years: checkup 2026");

	const { checkup } = await import("./checkup.js");
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
	const hub = await import("./hub.js");

	if (action === "plan") {
		const { repo, upload, changed, download, same } = await hub.plan(name);
		console.log(`${repo}: ${same} files are the same`);
		for (const [title, paths] of Object.entries({ upload, changed, download }))
			console.log(`${title} ${paths.length}`, paths.slice(0, 10));
	} else if (action === "push") await hub.push(name, Number(values.batch));
	else if (action === "pull") await hub.pull(name);
	else throw new Error("hub needs action: plan, pull or push");
}
