import { randomBytes } from "node:crypto";
import { type Request, type Response, Router } from "express";

/*
Signing in with Hugging Face (phase 32): the demo's AI runs on the visitor's own token, as the
owner's other space does (hf_oauth, scope inference-api) - the space pays nothing for a model.
A space whose card says `hf_oauth: true` is given OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET,
OAUTH_SCOPES, OPENID_PROVIDER_URL and SPACE_HOST, and Hugging Face takes the visitor back to
https://<SPACE_HOST>/login/callback.
  /login            to Hugging Face, which asks the visitor
  /login/callback   the code exchanged for the visitor's token, kept in this server's memory
                    for as long as Hugging Face gives it; the browser holds only a random cookie
  /logout           forgotten here
  /api/me           whether signing in is possible here, and who is signed in
The token never reaches the browser, a file or a log. Elsewhere (no OAUTH_CLIENT_ID) none of it
signs anyone in, and /api/me says so.
*/

const PROVIDER = (
	process.env.OPENID_PROVIDER_URL || "https://huggingface.co"
).replace(/\/+$/, "");
export const signingIn = () => Boolean(process.env.OAUTH_CLIENT_ID);
const COOKIE = "pjr_session";

type Session = { token: string; name: string; until: number };
const sessions = new Map<string, Session>();
const states = new Map<string, { back: string; until: number }>();

const forget = () => {
	const now = Date.now();
	for (const [key, one] of sessions) if (one.until < now) sessions.delete(key);
	for (const [key, one] of states) if (one.until < now) states.delete(key);
};

const cookieOf = (request: Request) =>
	(request.headers.cookie ?? "")
		.split(";")
		.map((one) => one.trim().split("="))
		.find(([name]) => name === COOKIE)?.[1];

// the visitor's session: its token for the model, or undefined
export function sessionOf(
	request: Request,
): (Session & { id: string }) | undefined {
	forget();
	const id = cookieOf(request);
	const found = id ? sessions.get(id) : undefined;
	return id && found ? { ...found, id } : undefined;
}

const callback = () =>
	`https://${process.env.SPACE_HOST ?? "localhost"}/login/callback`;

// only a path of this host to go back to after signing in
const backTo = (value: unknown) => {
	const text = String(value ?? "/");
	return /^\/(?!\/)[\w\-./#?=&%]*$/.test(text) ? text : "/";
};

export const oauthRoutes = Router();

oauthRoutes.get("/api/me", (request: Request, response: Response) => {
	const session = sessionOf(request);
	response.json({
		signingIn: signingIn(),
		user: session ? { name: session.name } : null,
	});
});

oauthRoutes.get("/login", (request: Request, response: Response) => {
	if (!signingIn()) {
		response.status(404).json({ error: "no signing in on this host" });
		return;
	}
	forget();
	const state = randomBytes(18).toString("base64url");
	states.set(state, {
		back: backTo(request.query.back),
		until: Date.now() + 600_000,
	});
	const scopes = process.env.OAUTH_SCOPES || "openid profile inference-api";
	const query = new URLSearchParams({
		client_id: String(process.env.OAUTH_CLIENT_ID),
		redirect_uri: callback(),
		scope: scopes,
		state,
		response_type: "code",
	});
	response.redirect(`${PROVIDER}/oauth/authorize?${query}`);
});

oauthRoutes.get(
	"/login/callback",
	async (request: Request, response: Response) => {
		const state = String(request.query.state ?? "");
		const asked = states.get(state);
		states.delete(state);
		if (!signingIn() || !asked || !request.query.code) {
			response.status(400).send("signing in failed: start again at /login");
			return;
		}
		try {
			const basic = Buffer.from(
				`${process.env.OAUTH_CLIENT_ID}:${process.env.OAUTH_CLIENT_SECRET}`,
			).toString("base64");
			const answer = await fetch(`${PROVIDER}/oauth/token`, {
				method: "POST",
				headers: {
					authorization: `Basic ${basic}`,
					"content-type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "authorization_code",
					code: String(request.query.code),
					redirect_uri: callback(),
					client_id: String(process.env.OAUTH_CLIENT_ID),
				}),
			});
			if (!answer.ok)
				throw new Error(`the token was refused (${answer.status})`);
			const given = (await answer.json()) as {
				access_token: string;
				expires_in?: number;
			};
			const who = await fetch(`${PROVIDER}/oauth/userinfo`, {
				headers: { authorization: `Bearer ${given.access_token}` },
			});
			const user = who.ok
				? ((await who.json()) as { preferred_username?: string; name?: string })
				: {};
			const id = randomBytes(24).toString("base64url");
			const seconds = Math.min(given.expires_in ?? 28_800, 28_800);
			sessions.set(id, {
				token: given.access_token,
				name: user.preferred_username ?? user.name ?? "",
				until: Date.now() + seconds * 1000,
			});
			// SameSite=None: the space is shown inside huggingface.co, in a frame
			response.setHeader(
				"Set-Cookie",
				`${COOKIE}=${id}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=None`,
			);
			response.redirect(asked.back);
		} catch (error) {
			response
				.status(502)
				.send(`signing in failed: ${(error as Error).message}`);
		}
	},
);

oauthRoutes.get("/logout", (request: Request, response: Response) => {
	const session = sessionOf(request);
	if (session) sessions.delete(session.id);
	response.setHeader(
		"Set-Cookie",
		`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`,
	);
	response.redirect(backTo(request.query.back));
});
