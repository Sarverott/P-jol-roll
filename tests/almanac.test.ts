import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, test } from "vitest";
import { ALMANAC, caseOf, chains, rules } from "../src/almanac/main.js";
import { learn, predict, recall } from "../src/almanac/patterning.js";
import { globMatches, judge } from "../src/almanac/ruling.js";

const GITHUB_LABELS = [
	"bug",
	"dependencies",
	"github_actions",
	"documentation",
	"enhancement",
	"javascript",
];

describe("almanac: the cases", () => {
	test("every chain has its page, its topic, and the page names it back", () => {
		const ids = new Set<string>();
		for (const chain of chains()) {
			expect(ids.has(chain.id), chain.id).toBe(false);
			ids.add(chain.id);
			expect(chain.events).toContain(chain.cataclysm);
			const page = caseOf(chain.page);
			expect(page.id).toBe(chain.id);
			expect(page.title).toBe(chain.title);
			expect(page.title.length).toBeLessThanOrEqual(256);
			for (const label of page.labels) expect(GITHUB_LABELS).toContain(label);
			const topic = join(ALMANAC, "solutions", `${chain.topic}.md`);
			expect(existsSync(topic), topic).toBe(true);
			expect(readFileSync(topic, "utf8")).toContain(`${chain.id}.md`);
		}
		const pages = readdirSync(join(ALMANAC, "cataclistics"));
		expect(pages.sort()).toEqual([...ids].map((id) => `${id}.md`).sort());
	});

	test("every relative link of the almanac leads to a file", () => {
		const files = readdirSync(ALMANAC, {
			recursive: true,
			encoding: "utf8",
		}).filter((name) => name.endsWith(".md"));
		for (const file of files) {
			const text = readFileSync(join(ALMANAC, file), "utf8");
			for (const [, link] of text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
				if (/^[a-z]+:/.test(link)) continue;
				const target = join(ALMANAC, dirname(file), link);
				expect(existsSync(target), `${file} -> ${link}`).toBe(true);
			}
		}
	});
});

describe("almanac: patterning, as in BOS", () => {
	test("events of a log lead to the case that began so", () => {
		const [first] = recall(chains(), ["hub:push", "hub:binary-refused"]);
		expect(first.id).toBe("hub-binary-text");
		expect(recall(chains(), ["tsc:"]).map((chain) => chain.id)).toContain(
			"container-missing-locales",
		);
	});

	test("what came after an event before is predicted, weighed by how often it was seen", () => {
		const patterns = learn([
			{
				id: "a",
				title: "",
				topic: "",
				page: "",
				events: ["x", "y"],
				seen: ["1", "2", "3"],
			},
			{ id: "b", title: "", topic: "", page: "", events: ["x", "z"] },
		]);
		expect(predict(patterns, ["x"]).next).toEqual([
			{ event: "y", p: 0.75 },
			{ event: "z", p: 0.25 },
		]);
		expect(predict(patterns, ["q"]).next).toEqual([]);
	});
});

describe("almanac: rulesets, as in BOS", () => {
	test("globs match whole, ignoring case", () => {
		expect(globMatches("dev/*", "dev/Cleo")).toBe(true);
		expect(globMatches("dev/*", "development")).toBe(false);
		expect(globMatches("master", "MASTER")).toBe(true);
	});

	const said: [
		string,
		string | undefined,
		string | undefined,
		string[],
		string,
	][] = [
		["push", "dataset", "agent", [], "violation"],
		["push", "dataset", "owner", [], "allowed"],
		["prune", "bucket", "owner", [], "violation"],
		["gather", "2026", "agent", [], "ask"],
		["cat", ".env", "agent", [], "violation"],
		["commit", "development", "agent", ["--no-verify"], "violation"],
		["push", "master", "agent", [], "ask"],
		["push", "dev/Cleo", "agent", [], "allowed"],
		["open-issue", undefined, "agent", [], "ask"],
	];
	test.each(said)(
		"%s %s by %s %j: %s",
		(action, target, actor, flags, verdict) => {
			expect(judge(rules(), { action, target, actor, flags }).verdict).toBe(
				verdict,
			);
		},
	);
});
