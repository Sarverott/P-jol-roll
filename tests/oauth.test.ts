import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// signing in with Hugging Face (phase 32) against a stand-in of its OAuth: the code is
// exchanged for a token, the token stays in the server, the browser gets only a cookie
const asked: { url: string; authorization: string; body: string }[] = [];
const provider = createServer((request, response) => {
	let body = "";
	request.on("data", (chunk) => {
		body += chunk;
	});
	request.on("end", () => {
		asked.push({
			url: request.url ?? "",
			authorization: String(request.headers.authorization),
			body,
		});
		response.setHeader("content-type", "application/json");
		if (request.url === "/oauth/token")
			response.end(
				JSON.stringify({ access_token: "hf_visitor", expires_in: 3600 }),
			);
		else if (request.url === "/oauth/userinfo")
			response.end(JSON.stringify({ preferred_username: "visitor" }));
		else response.writeHead(404).end("{}");
	});
});
await new Promise<void>((done) => provider.listen(0, "127.0.0.1", done));
process.env.OPENID_PROVIDER_URL = `http://127.0.0.1:${(provider.address() as AddressInfo).port}`;
process.env.OAUTH_CLIENT_ID = "client";
process.env.OAUTH_CLIENT_SECRET = "secret";
process.env.SPACE_HOST = "demo.hf.space";
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-oauth-"));
process.env.RESOURCES_DIR = join(work, "resources");
process.env.WEB_DIR = join(work, "no-web");

const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => {
	server.close();
	provider.close();
});

test("a visitor signs in with Hugging Face and only a cookie reaches the browser", async () => {
	expect(await (await fetch(`${url}/api/me`)).json()).toEqual({
		signingIn: true,
		user: null,
	});
	const start = await fetch(`${url}/login?back=/%23ask`, {
		redirect: "manual",
	});
	expect(start.status).toBe(302);
	const to = new URL(String(start.headers.get("location")));
	expect(to.pathname).toBe("/oauth/authorize");
	expect(Object.fromEntries(to.searchParams)).toMatchObject({
		client_id: "client",
		redirect_uri: "https://demo.hf.space/login/callback",
		scope: "openid profile inference-api",
		response_type: "code",
	});
	const state = String(to.searchParams.get("state"));

	// a state never given is refused
	expect(
		(
			await fetch(`${url}/login/callback?code=c&state=forged`, {
				redirect: "manual",
			})
		).status,
	).toBe(400);

	const back = await fetch(`${url}/login/callback?code=c0de&state=${state}`, {
		redirect: "manual",
	});
	expect(back.status).toBe(302);
	expect(back.headers.get("location")).toBe("/#ask");
	const cookie = String(back.headers.get("set-cookie"));
	expect(cookie).toMatch(
		/^pjr_session=[\w-]{32}; Path=\/; Max-Age=3600; HttpOnly; Secure; SameSite=None$/,
	);
	expect(cookie).not.toContain("hf_visitor");
	expect(asked[0]).toMatchObject({
		url: "/oauth/token",
		authorization: `Basic ${Buffer.from("client:secret").toString("base64")}`,
	});
	expect(asked[0].body).toContain("code=c0de");
	expect(asked[1]).toMatchObject({
		url: "/oauth/userinfo",
		authorization: "Bearer hf_visitor",
	});

	// the same state works once only
	expect(
		(
			await fetch(`${url}/login/callback?code=c0de&state=${state}`, {
				redirect: "manual",
			})
		).status,
	).toBe(400);

	const session = cookie.split(";")[0];
	expect(
		await (
			await fetch(`${url}/api/me`, { headers: { cookie: session } })
		).json(),
	).toEqual({ signingIn: true, user: { name: "visitor" } });
	const out = await fetch(`${url}/logout`, {
		headers: { cookie: session },
		redirect: "manual",
	});
	expect(out.status).toBe(302);
	expect(
		(
			await (
				await fetch(`${url}/api/me`, { headers: { cookie: session } })
			).json()
		).user,
	).toBeNull();
});

test("going back after signing in stays on this host", async () => {
	const start = await fetch(`${url}/login?back=//evil.example/x`, {
		redirect: "manual",
	});
	const state = new URL(String(start.headers.get("location"))).searchParams.get(
		"state",
	);
	const back = await fetch(`${url}/login/callback?code=c&state=${state}`, {
		redirect: "manual",
	});
	expect(back.headers.get("location")).toBe("/");
});

test("on the space the question is answered on the visitor's own token, and only signed in", async () => {
	// a stand-in of Inference Providers: the OpenAI dialect, streamed as data: lines
	const heard: { authorization: string; model: string; tools: number }[] = [];
	const providers = createServer((request, response) => {
		let body = "";
		request.on("data", (chunk) => {
			body += chunk;
		});
		request.on("end", () => {
			const data = JSON.parse(body);
			heard.push({
				authorization: String(request.headers.authorization),
				model: data.model,
				tools: data.tools?.length ?? 0,
			});
			response.setHeader("content-type", "text/event-stream");
			const pieces = ["Rada Stanu ", "doradzała [DU/1918/2]."];
			response.end(
				`${pieces
					.map(
						(content) =>
							`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`,
					)
					.join("")}data: [DONE]\n\n`,
			);
		});
	});
	await new Promise<void>((done) => providers.listen(0, "127.0.0.1", done));
	process.env.SPACE_ID = "Sarverott/docs-of-law-by-gov-in-poland";
	process.env.DEMO_URL = `http://127.0.0.1:${(providers.address() as AddressInfo).port}/v1`;
	process.env.DEMO_MODEL = "google/gemma-4-26B-A4B-it";
	try {
		const ask = (cookie?: string) =>
			fetch(
				`${url}/api/ask?question=${encodeURIComponent("Czym była Rada Stanu?")}`,
				{
					headers: cookie ? { cookie } : {},
				},
			);
		const refused = await ask();
		expect(refused.status).toBe(401);
		expect(await refused.json()).toMatchObject({
			login: "/login?back=/%23ask",
		});
		expect(await (await fetch(`${url}/api/ask/about`)).json()).toEqual({
			answers: true,
			signIn: true,
			model: "google/gemma-4-26B-A4B-it",
		});

		const start = await fetch(`${url}/login`, { redirect: "manual" });
		const state = new URL(
			String(start.headers.get("location")),
		).searchParams.get("state");
		const back = await fetch(`${url}/login/callback?code=c&state=${state}`, {
			redirect: "manual",
		});
		const session = String(back.headers.get("set-cookie")).split(";")[0];
		const answered = await ask(session);
		expect(answered.status).toBe(200);
		expect(await answered.json()).toMatchObject({
			answer: "Rada Stanu doradzała [DU/1918/2].",
			model: "google/gemma-4-26B-A4B-it",
			cited: [{ ELI: "DU/1918/2", read: false }],
			record: "",
		});
		expect(heard).toEqual([
			{
				authorization: "Bearer hf_visitor",
				model: "google/gemma-4-26B-A4B-it",
				tools: expect.any(Number),
			},
		]);
		expect(heard[0].tools).toBeGreaterThan(0);
	} finally {
		delete process.env.SPACE_ID;
		delete process.env.DEMO_URL;
		delete process.env.DEMO_MODEL;
		providers.close();
	}
});
