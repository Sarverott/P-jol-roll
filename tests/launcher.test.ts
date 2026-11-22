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

test("the REPL knows its own words and no unknown task runs", () => {
	const tasks = entriesOf(json, root);
	expect(interpret(tasks, "exit")).toEqual({ leave: true });
	expect(interpret(tasks, "menu")).toEqual({ leave: true, menu: true });
	expect(interpret(tasks, "nothing-like-it")).toEqual({ leave: false });
	expect(listing(tasks, "docs")).toContain("docs:build");
	expect(listing(tasks, "docs")).not.toContain("gather");
});
