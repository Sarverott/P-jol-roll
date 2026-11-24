import { type Request, type Response, Router } from "express";

/*
GET /api/ask?question=... - the law mastermind (phase 30, src/mastermind) answering through
this api's own MCP tools. Only an api started with a mastermind (MASTERMIND_URL: the service
"mastermind" of compose, or task serve with it set) answers; elsewhere 503 says so. A public
host never asks one (SPACE_ID of Hugging Face): a model's time is not given away. One question
at a time: another while one runs gets 429.
*/

export const askEnabled = () =>
	Boolean(process.env.MASTERMIND_URL) && !process.env.SPACE_ID;

let busy = false;

export const askRoutes = Router();

askRoutes.get("/api/ask", async (request: Request, response: Response) => {
	const question = String(request.query.question ?? "").trim();
	if (!askEnabled()) {
		response.status(503).json({
			error:
				"no mastermind on this host: an api started with MASTERMIND_URL (docker compose --profile mastermind up -d, or task mastermind:ask from a terminal)",
		});
		return;
	}
	if (!question || question.length > 2000) {
		response
			.status(400)
			.json({ error: "a question of 1 to 2000 characters: ?question=..." });
		return;
	}
	if (busy) {
		response
			.status(429)
			.json({ error: "the mastermind is answering another question" });
		return;
	}
	busy = true;
	const { connect } = await import("../mcp/client.js");
	const { ask } = await import("../mastermind/ask.js");
	const client = await connect(
		`http://127.0.0.1:${request.socket.localPort}/mcp`,
	);
	try {
		response.json(await ask(question, client));
	} catch (error) {
		response.status(502).json({ error: (error as Error).message });
	} finally {
		busy = false;
		await client.close();
	}
});
