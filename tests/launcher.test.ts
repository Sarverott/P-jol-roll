import { expect, test } from "vitest";
import { interpret, listing } from "../src/cli/repl.js";
import { entriesOf, groupOf, groups, words } from "../src/cli/tasks.js";

const root = "/repo/";
const json = {
	tasks: [
		{
			name: "gather",
			desc: "gather",
			location: { taskfile: "/repo/Taskfile.yml" },
		},
		{
			name: "gather:changes",
			desc: "changes",
			location: { taskfile: "/repo/Taskfile.yml" },
		},
		{
			name: "docs:build",
			desc: "website",
			location: { taskfile: "/repo/docs/Taskfile.yml" },
		},
		{
			name: "flow:land",
			desc: "land",
			location: { taskfile: "/repo/scripts/devops/Taskfile.yml" },
		},
		{
			name: "serve",
			desc: "api",
			location: { taskfile: "/repo/src/Taskfile.yml" },
		},
	],
};

test("every task is grouped by the Taskfile it comes from", () => {
	const tasks = entriesOf(json, root);
	expect(tasks.map((task) => `${task.name}@${task.group}`)).toEqual([
		"gather@project",
		"gather:changes@project",
		"docs:build@docs",
		"flow:land@flow",
		"serve@src",
	]);
	expect(groups(tasks)).toEqual(["project", "docs", "flow", "src"]);
	expect(groupOf("docs/devlog/Taskfile.yml")).toBe("devlog");
});

test("a typed line keeps quoted words whole", () => {
	expect(words('land -- "a batch of work" x')).toEqual([
		"land",
		"--",
		"a batch of work",
		"x",
	]);
});

test("the REPL knows its own words and no unknown task runs", async () => {
	const tasks = entriesOf(json, root);
	expect(await interpret(tasks, "exit")).toEqual({ leave: true });
	expect(await interpret(tasks, "menu")).toEqual({ leave: true, menu: true });
	expect(await interpret(tasks, "nothing-like-it")).toEqual({ leave: false });
	expect(listing(tasks, "docs")).toContain("docs:build");
	expect(listing(tasks, "docs")).not.toContain("gather");
});

test("a function of the catalog is a command: words become its values and its task's arguments", async () => {
	const { procedure } = await import("../src/core/catalog/procedures.js");
	const { taskArgs, valuesOf } = await import("../src/core/catalog/run.js");
	const acts = procedure("acts");
	if (!acts) throw new Error("no acts in the catalog");
	expect(valuesOf(acts, ["MP", "2025", "query=podatek"])).toMatchObject({
		journal: "MP",
		year: 2025,
		query: "podatek",
		offset: 0,
	});
	const gather = procedure("gather");
	if (!gather) throw new Error("no gather in the catalog");
	expect(
		taskArgs(gather, valuesOf(gather, ["2025", "2026", "--acts", "limit=3"])),
	).toEqual(["2025", "2026", "--acts", "--limit", "3"]);
	expect(() => valuesOf(procedure("act") ?? gather, [])).toThrow("needs eli");
	const ran: string[][] = [];
	await interpret(entriesOf(json, root), "gather 2026 --acts", (name, args) => {
		ran.push([name, ...args]);
		return 0;
	});
	expect(ran).toEqual([["gather", "2026", "--acts", "--limit", "5"]]);
});
