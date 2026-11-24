import { type Request, type Response, Router } from "express";
import { teamOf } from "../mastermind/team.js";
import { sessionOf, signingIn } from "./oauth.js";

/*
GET /api/ask?question=... - the law mastermind (src/mastermind) answering through this api's
own MCP tools.
  an api started with a mastermind (MASTERMIND_URL: compose's "mastermind", or task serve with
  it set) asks that model, one question at a time
  the demo space (phase 32) asks on the visitor's own Hugging Face token, once signed in
  (oauth.ts): the model through Inference Providers - DEMO_MODEL, google/gemma-4-26B-A4B-it by
  default - so the space gives no model's time away; one question at a time per visitor, four
  at once in all; a visitor's conversation is not kept
The advanced strategy (phase 34, src/mastermind/strategy.ts): &hard=1 straight to the deepseek
hosted by Hugging Face (HARD_MODEL), &escalate=1 the usual model first and the deepseek when its
answer is weak - on the visitor's token on the space, on HF_TOKEN of the host here.
Anywhere else 503 says how to have one; a visitor not signed in gets 401 and where to sign in.
*/

const onSpace = () => Boolean(process.env.SPACE_ID);
export const askEnabled = () =>
	onSpace() ? signingIn() : Boolean(process.env.MASTERMIND_URL);

const busy = new Set<string>();
const AT_ONCE = () => (onSpace() ? 4 : 1);

export const askRoutes = Router();

askRoutes.get("/api/ask", async (request: Request, response: Response) => {
	const question = String(request.query.question ?? "").trim();
	if (!askEnabled()) {
		response.status(503).json({
			error: onSpace()
				? "this space has no signing in with Hugging Face (hf_oauth in its card)"
				: "no mastermind on this host: an api started with MASTERMIND_URL (docker compose --profile mastermind up -d, or task mastermind:ask from a terminal)",
		});
		return;
	}
	const session = onSpace() ? sessionOf(request) : undefined;
	if (onSpace() && !session) {
		response.status(401).json({
			error: "sign in with Hugging Face: the answer runs on your own account",
			login: "/login?back=/%23ask",
		});
		return;
	}
	if (!question || question.length > 2000) {
		response
			.status(400)
			.json({ error: "a question of 1 to 2000 characters: ?question=..." });
		return;
	}
	const who = session?.id ?? "here";
	if (busy.has(who) || busy.size >= AT_ONCE()) {
		response.status(429).json({
			error: busy.has(who)
				? "your previous question is still being answered"
				: "the mastermind is answering others - try again in a minute",
		});
		return;
	}
	busy.add(who);
	const { connect } = await import("../mcp/client.js");
	const { ask, settings } = await import("../mastermind/ask.js");
	const { hardSettings, strategy } = await import("../mastermind/strategy.js");
	const mode =
		request.query.hard === "1"
			? "hard"
			: request.query.escalate === "1"
				? "escalate"
				: undefined;
	const self = `http://127.0.0.1:${request.socket.localPort}/mcp`;
	const client = await connect(
		self,
		session ? { authorization: `Bearer ${session.token}` } : undefined,
	);
	try {
		const base = settings();
		const config = session
			? {
					...base,
					team: undefined,
					url: process.env.DEMO_URL || "https://router.huggingface.co/v1",
					model: process.env.DEMO_MODEL || "google/gemma-4-26B-A4B-it",
					key: session.token,
				}
			: base;
		const hard = hardSettings();
		response.json(
			mode
				? await strategy(question, client, {
						keep: !session,
						config,
						mode,
						hard: session
							? {
									...hard,
									url: process.env.DEMO_URL || hard.url,
									key: session.token,
								}
							: hard,
					})
				: await ask(question, client, { keep: !session, config }),
		);
	} catch (error) {
		// never the token: only what the model's api said
		response.status(502).json({
			error: (error as Error).message.replaceAll(session?.token ?? "\0", "***"),
		});
	} finally {
		busy.delete(who);
		await client.close();
	}
});

// whether this host answers questions, and how (the viewer's chat asks it first)
askRoutes.get(
	"/api/ask/about",
	async (_request: Request, response: Response) => {
		const { hardSettings } = await import("../mastermind/strategy.js");
		response.json({
			answers: askEnabled(),
			signIn: onSpace() && signingIn(),
			// the deepseek of hard questions, when this host can pay for it (phase 34)
			hard:
				askEnabled() && (onSpace() || Boolean(hardSettings().key))
					? hardSettings().model
					: "",
			model: onSpace()
				? process.env.DEMO_MODEL || "google/gemma-4-26B-A4B-it"
				: process.env.MASTERMIND_URL
					? process.env.MASTERMIND_MODEL ||
						teamOf(process.env.MASTERMIND_TEAM)?.answer ||
						"deepseek-r1:8b"
					: "",
		});
	},
);
