import { resolve } from "node:path";
import { type Request, type Response, Router } from "express";
import * as library from "../core/reading/library.js";
import { spec } from "./spec.js";

// every route only reads gathered files - nothing here asks the source or writes
export const routes = Router();

const eliOf = (request: Request) =>
	`${request.params.journal}/${request.params.year}/${request.params.pos}`;

const notHere = (response: Response) =>
	response.status(404).json({ error: "not gathered here" });

routes.get("/openapi.json", (_request, response) => {
	response.json(spec);
});

routes.get("/api/journals", (_request, response) => {
	response.json(library.journals());
});

routes.get("/api/acts/:journal/:year", (request, response) => {
	const { q, offset, limit } = request.query;
	response.json(
		library.acts(String(request.params.journal), Number(request.params.year), {
			query: typeof q === "string" ? q : "",
			offset: Number(offset) || 0,
			limit: Number(limit) || 50,
		}),
	);
});

routes.get("/api/acts/:journal/:year/:pos", (request, response) => {
	const view = library.act(eliOf(request));
	if (view) response.json(view);
	else notHere(response);
});

routes.get("/api/acts/:journal/:year/:pos/text", (request, response) => {
	const markdown = library.text(eliOf(request));
	if (markdown === undefined) notHere(response);
	else response.type("text/markdown; charset=utf-8").send(markdown);
});

routes.get("/api/acts/:journal/:year/:pos/references", (request, response) => {
	const ties = library.references(eliOf(request));
	if (ties) response.json(ties);
	else notHere(response);
});

routes.get(
	"/api/acts/:journal/:year/:pos/file/:ending",
	(request, response) => {
		const path = library.file(eliOf(request), String(request.params.ending));
		if (path) response.sendFile(resolve(path));
		else notHere(response);
	},
);
