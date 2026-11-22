import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// three statutes in force, one repealed, one regulation; ties among them
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-map-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");

const act = (pos: number, type: string, status: string) => ({
	ELI: `DU/2000/${pos}`,
	address: `WDU2000000000${pos}`,
	publisher: "DU",
	year: 2000,
	pos,
	title: `${type} ${pos}`,
	type,
	status,
	textPDF: true,
	textHTML: false,
});
const put = async (path: string, lines: unknown[]) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(
		join(resources, path),
		lines.map((line) => `${JSON.stringify(line)}\n`).join(""),
	);
};
await put("dataset/acts/DU/2000.jsonl", [
	act(1, "Ustawa", "obowiązujący"),
	act(2, "Ustawa", "obowiązujący"),
	act(3, "Ustawa", "obowiązujący"),
	act(4, "Ustawa", "uchylony"),
	act(5, "Rozporządzenie", "obowiązujący"),
]);
await put("dataset/references/DU/2000.jsonl", [
	{ from: "DU/2000/1", type: "Akty zmienione", to: "DU/2000/2" },
	{ from: "DU/2000/1", type: "Akty zmienione", to: "DU/2000/2" },
	{ from: "DU/2000/3", type: "Podstawa prawna", to: "DU/2000/1" },
	{ from: "DU/2000/4", type: "Akty uchylone", to: "DU/2000/1" },
	{ from: "DU/2000/5", type: "Podstawa prawna", to: "DU/2000/1" },
]);
await writeFile(join(resources, ".map.json"), "{}");

const { lawMap, map } = await import("../src/core/methods/map.js");
const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => server.close());

test("a preset takes its acts and the ties among them, placed and sized", () => {
	const made = lawMap("statutes-in-force", 20);
	expect(made.nodes.map(([eli]) => eli)).toEqual([
		"DU/2000/1",
		"DU/2000/2",
		"DU/2000/3",
	]);
	expect(made.kinds).toEqual(["Ustawa"]);
	expect(made.ties).toEqual(["Akty zmienione", "Podstawa prawna"]);
	expect(made.edges).toEqual([
		[0, 1, 0],
		[2, 0, 1],
	]);
	for (const [, , x, y, size] of made.nodes) {
		expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
		expect(size).toBeGreaterThan(2);
	}
	expect(lawMap("in-force", 20).nodes).toHaveLength(4);
	expect(() => lawMap("everything")).toThrow(/no preset/);
});

test("the api names the presets and gives a made map", async () => {
	expect((await fetch(`${url}/api/map/statutes`)).status).toBe(404);
	await map(["statutes"]);
	const presets = await (await fetch(`${url}/api/map`)).json();
	expect(presets).toContainEqual({
		name: "statutes",
		description: "every statute (ustawa) since 1918",
		made: true,
	});
	const made = await (await fetch(`${url}/api/map/statutes`)).json();
	expect(made.nodes).toHaveLength(4);
	expect((await fetch(`${url}/api/map/..%2F.map`)).status).toBe(404);
});
