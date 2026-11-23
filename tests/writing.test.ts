import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// Q19 (phase 25): writing functions started by a host on this machine with --allow-writing
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-writing-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");
const year = join(resources, "dataset/acts/DU/1918.jsonl");
await mkdir(join(year, ".."), { recursive: true });
await writeFile(
	year,
	`${JSON.stringify({ ELI: "DU/1918/1", publisher: "DU", year: 1918, pos: 1, title: "Dekret", type: "Dekret", status: "uchylony" })}\n`,
);

const { serve } = await import("../src/openapi/server.js");
const writer = await serve({ port: 0, writing: true });
const reader = await serve({ port: 0 });
afterAll(() => {
	writer.server.close();
	reader.server.close();
});

const post = (
	url: string,
	body: unknown,
	headers: Record<string, string> = {},
) =>
	fetch(`${url}/api/jobs`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});

test("a reading host lists writing functions as not allowed and has no jobs", async () => {
	const catalog = await (await fetch(`${reader.url}/api/catalog`)).json();
	const stats = catalog.find((one: { name: string }) => one.name === "stats");
	expect(stats).toMatchObject({ writes: true, allowed: false });
	expect((await post(reader.url, { name: "stats", yes: true })).status).toBe(
		404,
	);
});

test("a writing host allows them, but only after a yes, as JSON, from its own pages", async () => {
	const catalog = await (await fetch(`${writer.url}/api/catalog`)).json();
	const stats = catalog.find((one: { name: string }) => one.name === "stats");
	expect(stats).toMatchObject({ writes: true, allowed: true });

	expect((await post(writer.url, { name: "stats" })).status).toBe(400);
	expect((await post(writer.url, { name: "acts", yes: true })).status).toBe(
		404,
	);
	const elsewhere = await post(
		writer.url,
		{ name: "stats", yes: true },
		{ Origin: "https://example.org" },
	);
	expect(elsewhere.status).toBe(403);
	const form = await fetch(`${writer.url}/api/jobs`, {
		method: "POST",
		headers: { "Content-Type": "text/plain" },
		body: JSON.stringify({ name: "stats", yes: true }),
	});
	expect(form.status).toBe(415);
});

test("a request addressed to another name than this machine is refused", async () => {
	const { port } = new URL(writer.url);
	const status = await new Promise<number>((done, fail) => {
		const asked = httpRequest(
			{
				host: "127.0.0.1",
				port,
				path: "/api/jobs",
				headers: { Host: `rebound.example.org:${port}` },
			},
			(response) => {
				response.resume();
				done(response.statusCode ?? 0);
			},
		);
		asked.on("error", fail);
		asked.end();
	});
	expect(status).toBe(403);
});

test("a job runs the function's task and is followed to its end", async () => {
	const started = await post(writer.url, { name: "stats", yes: true });
	expect(started.status).toBe(202);
	const { id } = await started.json();
	let job: { state: string; lines: string[] } = { state: "running", lines: [] };
	for (let tries = 0; tries < 120 && job.state === "running"; tries++) {
		await new Promise((done) => setTimeout(done, 500));
		job = await (await fetch(`${writer.url}/api/jobs/${id}`)).json();
	}
	expect(job.state, job.lines.join("\n")).toBe("done");
	const counted = JSON.parse(
		await readFile(join(resources, "dataset/statistics/acts.json"), "utf8"),
	);
	expect(JSON.stringify(counted)).toContain("1918");
}, 90_000);

test("the host says what it is: its release and its short name (phase 28)", async () => {
	const asWriter = await (await fetch(`${writer.url}/api/host`)).json();
	const asReader = await (await fetch(`${reader.url}/api/host`)).json();
	const { spec } = await import("../src/openapi/spec.js");
	expect(asReader.version).toBe(spec.info.version);
	expect(asReader.writing).toBe(false);
	expect(asReader.label).toMatch(/^local-readonly/);
	expect(asWriter.label).toMatch(/^local-writing/);
});
