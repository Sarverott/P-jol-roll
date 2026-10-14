import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { io } from "socket.io-client";
import { afterAll, expect, test } from "vitest";

// a small gathered year, written as the gatherer and "task text" would leave it
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-reading-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");

const acts = [
	{
		ELI: "DU/1918/1",
		address: "WDU19180010001",
		publisher: "DU",
		year: 1918,
		pos: 1,
		title: "Dekret o Radzie Regencyjnej",
		textPDF: true,
		textHTML: false,
	},
	{
		ELI: "DU/1918/2",
		address: "WDU19180020002",
		publisher: "DU",
		year: 1918,
		pos: 2,
		title: "Ustawa o Radzie Stanu",
		textPDF: true,
		textHTML: true,
	},
];
const put = async (path: string, content: string) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(join(resources, path), content);
};
await put(
	"dataset/acts/DU/1918.jsonl",
	acts.map((act) => `${JSON.stringify(act)}\n`).join(""),
);
await put(
	"dataset/lists/publishers.json",
	JSON.stringify([{ code: "DU", name: "Dziennik Ustaw" }]),
);
await put(
	"bucket/DU/1918/WDU19180020002.json",
	JSON.stringify({
		...acts[1],
		references: { "Akty wykonawcze": [{ id: "DU/1918/20" }] },
	}),
);
await put("bucket/DU/1918/WDU19180020002.pdf", "%PDF-1.4");
await put(
	"dataset/texts/DU/1918/WDU19180020002.md",
	"# Ustawa o Radzie Stanu\n\n### Art. 1.\n",
);
await put(".map.json", "{}");

const library = await import("../src/core/reading/library.js");
const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => server.close());

test("reads journals, pages of acts and one act from files", () => {
	expect(library.journals()).toEqual([
		{ code: "DU", name: "Dziennik Ustaw", years: [1918] },
	]);
	expect(
		library
			.acts("DU", 1918, { query: "radzie STANU" })
			.items.map((act) => act.ELI),
	).toEqual(["DU/1918/2"]);
	expect(library.acts("DU", 1918, { offset: 1, limit: 1 })).toMatchObject({
		total: 2,
		offset: 1,
	});
	expect(library.act("DU/1918/2")).toMatchObject({
		files: [".json", ".pdf"],
		markdown: true,
	});
	expect(library.act("DU/1918/1")).toMatchObject({
		files: [],
		markdown: false,
	});
	expect(library.references("DU/1918/2")).toEqual([
		{ from: "DU/1918/2", type: "Akty wykonawcze", to: "DU/1918/20" },
	]);
	expect(library.act("DU/1918/9")).toBeUndefined();
	expect(library.parseEli("../../etc")).toBeUndefined();
});

test("http api answers from the same files and nothing outside them", async () => {
	const get = (path: string) => fetch(`${url}${path}`);
	expect(await (await get("/api/journals")).json()).toHaveLength(1);
	expect((await (await get("/api/acts/DU/1918?q=dekret")).json()).total).toBe(
		1,
	);
	const text = await get("/api/acts/DU/1918/2/text");
	expect(text.headers.get("content-type")).toContain("text/markdown");
	expect(await text.text()).toContain("Art. 1.");
	expect(text.headers.get("access-control-allow-origin")).toBe("*");
	expect(await (await get("/api/acts/DU/1918/2/file/.pdf")).text()).toBe(
		"%PDF-1.4",
	);
	expect((await get("/api/acts/DU/1918/2/file/.env")).status).toBe(404);
	expect(
		(await get("/api/acts/DU/1918/2/file/..%2F..%2F.map.json")).status,
	).toBe(404);
	expect((await get("/api/acts/DU/1918/1/text")).status).toBe(404);
	expect((await (await get("/openapi.json")).json()).openapi).toBe("3.1.0");
});

test("socket.io tells what is here and what changed", async () => {
	const socket = io(url, { transports: ["websocket"] });
	const journals = await new Promise((done) => socket.once("journals", done));
	expect(journals).toHaveLength(1);
	const changed = new Promise<string[]>((done) => socket.once("changed", done));
	await put("dataset/acts/DU/1919.jsonl", "");
	expect((await changed).some((path) => path.includes("1919"))).toBe(true);
	socket.close();
}, 10000);
