import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// Hugging Face as the demo sees it: a dataset and a bucket answering files by path
const act = {
	ELI: "DU/1918/2",
	address: "WDU19180020002",
	publisher: "DU",
	year: 1918,
	pos: 2,
	title: "Ustawa o Radzie Stanu",
	textPDF: true,
	textHTML: false,
};
const files: Record<string, string> = {
	"/dataset/lists/publishers.json": JSON.stringify([
		{ code: "DU", name: "Dziennik Ustaw", years: [1918, 1919] },
	]),
	"/dataset/acts/DU/1918.jsonl": `${JSON.stringify(act)}\n`,
	"/dataset/texts/DU/1918/WDU19180020002.md": "# Ustawa o Radzie Stanu\n",
	"/bucket/DU/1918/WDU19180020002.json": JSON.stringify({
		...act,
		references: { "Akty zmienione": [{ id: "DU/1918/1" }] },
	}),
};
const asked: string[] = [];
const hub = createServer((request, response) => {
	asked.push(request.url ?? "");
	const body = files[request.url ?? ""];
	response.writeHead(body === undefined ? 404 : 200).end(body ?? "");
});
await new Promise<void>((done) => hub.listen(0, "127.0.0.1", done));
const address = hub.address();
const base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

process.env.RESOURCES_DIR = join(
	await mkdtemp(join(tmpdir(), "p-jol-roll-remote-")),
	"resources",
);
process.env.WEB_DIR = "no-web";
process.env.DATASET_URL = `${base}/dataset/`;
process.env.BUCKET_URL = `${base}/bucket`;

const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => {
	server.close();
	hub.close();
});
const get = (path: string) => fetch(`${url}${path}`, { redirect: "manual" });

test("the demo reads only what a page needs from the dataset on Hugging Face", async () => {
	expect(await (await get("/api/journals")).json()).toEqual([
		{ code: "DU", name: "Dziennik Ustaw", years: [1918, 1919] },
	]);
	expect(asked).toEqual(["/dataset/lists/publishers.json"]);

	expect((await (await get("/api/acts/DU/1918?q=stanu")).json()).total).toBe(1);
	expect(await (await get("/api/acts/DU/1918/2")).json()).toMatchObject({
		files: [".json", ".pdf"],
		markdown: true,
		details: { references: { "Akty zmienione": [{ id: "DU/1918/1" }] } },
	});
	expect(await (await get("/api/acts/DU/1918/2/text")).text()).toContain(
		"Radzie Stanu",
	);
	// a file taken once is read here afterwards
	expect(
		asked.filter((path) => path === "/dataset/acts/DU/1918.jsonl"),
	).toHaveLength(1);
});

test("raw files are read on the bucket, not passed through the demo", async () => {
	const pdf = await get("/api/acts/DU/1918/2/file/.pdf");
	expect(pdf.status).toBe(302);
	expect(pdf.headers.get("location")).toBe(
		`${base}/bucket/DU/1918/WDU19180020002.pdf`,
	);
	expect(asked).not.toContain("/bucket/DU/1918/WDU19180020002.pdf");
	expect((await get("/api/acts/DU/1918/2/file/.html")).status).toBe(404);
	expect((await get("/api/acts/DU/1918/9")).status).toBe(404);
});

test("an address that is not a plain path never reaches Hugging Face or the disk", async () => {
	const { inside } = await import("../src/core/reading/remote.js");
	expect(inside("/r/dataset", "acts/DU/2026.jsonl")).toBe(
		"/r/dataset/acts/DU/2026.jsonl",
	);
	for (const path of [
		"../secrets/x",
		"acts/../../x",
		"/etc/passwd",
		"acts/%2e%2e/x",
		"acts//x",
		"",
	])
		expect(inside("/r/dataset", path)).toBeUndefined();

	asked.length = 0;
	// a raw request, so ".." is not folded by the client
	const raw = await new Promise<number>((done) => {
		const port = new URL(url).port;
		import("node:net").then(({ connect }) => {
			const socket = connect(Number(port), "127.0.0.1", () =>
				socket.write(
					"GET /api/acts/../1918 HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n",
				),
			);
			let text = "";
			socket.on("data", (chunk) => {
				text += chunk;
			});
			socket.on("end", () => done(Number(text.split(" ")[1])));
		});
	});
	expect(raw).toBeGreaterThanOrEqual(400);
	expect(asked.filter((path) => path.includes(".."))).toEqual([]);
	expect(asked).not.toContain("/dataset/1918.jsonl");
});

test("answers carry the rate limit of an address (RATE_LIMIT a minute)", async () => {
	const answer = await get("/api/journals");
	expect(answer.headers.get("ratelimit-policy") ?? "").toMatch(/q=600/);
});
