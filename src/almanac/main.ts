import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AlmanacScope } from "../core/vars/interfaces/index.js";
import { learn, predict, recall } from "./patterning.js";
import { judge } from "./ruling.js";

/*
The almanac of the project from a terminal (task almanac:*):
  recall hub:push hub:     the cases whose chains hold these events, with their solutions
  predict hub:push         what came next after these events before
  judge push dataset --actor agent    the verdict of the rulesets on a case
  cases                    every case with its page and its issue on GitHub, when opened
  issues [--open <id>|all] the cases as issues: listed; with --open made on GitHub by gh (the
                           owner's move), a solved one closed at once as completed, and its
                           number written into the page
*/

const SITE = "https://sarverott.github.io/P-jol-roll/docs/almanac";

export const ALMANAC = process.env.ALMANAC_DIR ?? "docs/almanac";

const jsonOf = <T>(dir: string, key: string): T[] =>
	readdirSync(join(ALMANAC, dir))
		.filter((name) => name.endsWith(".json"))
		.flatMap(
			(name) =>
				JSON.parse(readFileSync(join(ALMANAC, dir, name), "utf8"))[key] ?? [],
		);

export const chains = () => jsonOf<AlmanacScope.Chain>("patterning", "chains");
export const rules = () => jsonOf<AlmanacScope.Rule>("rulesets", "rules");

// the front matter of a case page: id, labels, status, issue
export function caseOf(page: string) {
	const text = readFileSync(join(ALMANAC, page), "utf8");
	const head = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
	const field = (name: string) =>
		new RegExp(`^${name}:[ \\t]*(.*)$`, "m").exec(head)?.[1].trim() ?? "";
	return {
		id: field("id"),
		labels: field("labels")
			.replace(/^\[|\]$/g, "")
			.split(",")
			.map((label) => label.trim())
			.filter(Boolean),
		status: field("status"),
		issue: field("issue"),
		title: /^# (.+)$/m.exec(text)?.[1] ?? "",
		body: text.slice(text.indexOf("\n---\n", 4) + 5).trim(),
	};
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const [command, ...words] = process.argv.slice(2);
	const events = words.filter((word) => !word.startsWith("--"));
	if (command === "recall") {
		const found = recall(chains(), events);
		if (!found.length) console.log("no case holds these events");
		for (const chain of found)
			console.log(
				`${chain.title}\n  ${chain.events.join(" → ")}\n  ${chain.solution}\n  ${ALMANAC}/${chain.page}\n`,
			);
	} else if (command === "predict") {
		const { after, next } = predict(learn(chains()), events);
		console.log(`after ${after}:`);
		for (const { event, p } of next)
			console.log(`  ${event} (${Math.round(p * 100)}%)`);
		if (!next.length) console.log("  nothing met before");
	} else if (command === "judge") {
		// judge push dataset --actor agent; judge commit development --no-verify
		const at = words.indexOf("--actor");
		const actor = at === -1 ? undefined : words[at + 1];
		const [action, target] = words.filter(
			(word, index) =>
				!word.startsWith("--") && (at === -1 || index !== at + 1),
		);
		const { verdict, rule } = judge(rules(), {
			action,
			target,
			actor,
			flags: words.filter(
				(word) => word.startsWith("--") && word !== "--actor",
			),
		});
		console.log(
			rule ? `${verdict}: ${rule.statement} (${rule.source})` : verdict,
		);
		process.exitCode = verdict === "violation" ? 1 : 0;
	} else if (command === "cases") {
		for (const chain of chains()) {
			const page = caseOf(chain.page);
			console.log(
				`${chain.id.padEnd(28)} ${(page.issue ? `#${page.issue}` : "-").padEnd(6)} ${page.status}`,
			);
		}
	} else if (command === "issues") {
		const at = words.indexOf("--open");
		const wanted = at === -1 ? undefined : words[at + 1];
		for (const chain of chains()) {
			const page = caseOf(chain.page);
			const open = wanted === "all" || wanted === chain.id;
			if (!open || page.issue) {
				console.log(
					`${chain.id.padEnd(28)} ${page.issue ? `#${page.issue}` : "not opened"}  ${page.title}`,
				);
				continue;
			}
			const body = `${page.body
				.replace(/^# .+\n+/, "")
				.replace(
					/\]\(\.\.\/solutions\/([\w-]+)\.md\)/g,
					`](${SITE}/solutions/$1/)`,
				)}\n\n---\nFrom the almanac: ${SITE}/cataclistics/${chain.id}/`;
			const url = execFileSync(
				"gh",
				[
					"issue",
					"create",
					"--title",
					page.title,
					"--body",
					body,
					...page.labels.flatMap((label) => ["--label", label]),
				],
				{ encoding: "utf8" },
			).trim();
			const number = url.split("/").at(-1) ?? "";
			if (page.status.startsWith("solved"))
				execFileSync("gh", [
					"issue",
					"close",
					number,
					"--reason",
					"completed",
					"--comment",
					"Solved - the solution is in the issue and in the almanac.",
				]);
			const path = join(ALMANAC, chain.page);
			writeFileSync(
				path,
				readFileSync(path, "utf8").replace(/^issue:.*$/m, `issue: ${number}`),
			);
			console.log(`${chain.id.padEnd(28)} #${number} ${url}`);
		}
	} else {
		console.log(
			"almanac: recall <events...> | predict <events...> | judge <action> [target] [--actor agent] | cases | issues [--open <id>|all]",
		);
		process.exitCode = command ? 1 : 0;
	}
}
