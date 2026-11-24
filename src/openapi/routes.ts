import { resolve } from "node:path";
import { type Request, type Response, Router } from "express";
import { PROCEDURES } from "../core/catalog/procedures.js";
import { described } from "../core/catalog/run.js";
import { PRESETS } from "../core/methods/presets.js";
import * as dataset from "../core/reading/dataset.js";
import * as library from "../core/reading/library.js";
import { remote } from "../core/reading/remote.js";
import { askRoutes } from "./ask.js";
import { host } from "./host.js";
import { oauthRoutes } from "./oauth.js";
import { spec } from "./spec.js";

// every route only reads gathered files - nothing here asks the source or writes
export const routes = Router();

// parts of an address of an act are checked before any route reads a file by them:
// a journal is letters (DU, MP), a year and a position are numbers
const PARTS: Record<string, RegExp> = {
	journal: /^[A-Za-z]{1,16}$/,
	year: /^\d{1,4}$/,
	pos: /^\d{1,7}$/,
};
for (const [name, pattern] of Object.entries(PARTS))
	routes.param(name, (_request, response, next, value) => {
		if (pattern.test(String(value))) next();
		else response.status(404).json({ error: `not a ${name}` });
	});

/*
What reaches a file is never the request's own words (Snyk Code javascript/PT, phase 27): a
journal is the code of one the dataset has, a year and a position are numbers, a preset and an
ending are names of fixed lists - each taken from our side, after the words matched it.
*/
const journalOf = (request: Request) =>
	library.journals().find((one) => one.code === request.params.journal)?.code;

const eliOf = (request: Request) => {
	const journal = journalOf(request);
	return journal
		? `${journal}/${Number(request.params.year)}/${Number(request.params.pos)}`
		: "";
};

const notHere = (response: Response) =>
	response.status(404).json({ error: "not gathered here" });

// remote mode (the demo): what an address needs is taken from Hugging Face first
if (remote)
	routes.use("/api", (request, _response, next) => {
		const [, kind, journal, year, pos] = request.path.split("/");
		const number = (value?: string) =>
			value && /^\d+$/.test(value) ? Number(value) : undefined;
		// a journal is letters only (DU, MP); anything else is not taken from Hugging Face
		const named =
			journal && /^[A-Za-z]{1,16}$/.test(journal) ? journal : undefined;
		const OTHER = [
			"statistics",
			"lists",
			"sejm",
			"judgments",
			"analysis",
			"eu",
			"agreements",
		];
		const ready =
			kind === "map"
				? library.prepareMap(named)
				: OTHER.includes(kind)
					? dataset.prepareDataset(kind, journal, year)
					: library.prepare(
							kind === "acts" ? named : undefined,
							number(year),
							number(pos),
						);
		ready.then(() => next(), next);
	});

// a question to the law mastermind, where this api has one (phase 30, ask.ts)
routes.use(askRoutes);
// signing in with Hugging Face, where the host is a space with hf_oauth (oauth.ts)
routes.use(oauthRoutes);

routes.get("/openapi.json", (_request, response) => {
	response.json(spec);
});

// what this host is: the release, the commit, where it runs (the viewer's corner, phase 28)
routes.get("/api/host", (request, response) => {
	response.json(host(Boolean(request.app.locals.writing)));
});

// every function of the project (the catalog), with whether this host may start it: a writing
// one only when the api runs with --allow-writing on this machine (Q19, writing.ts); elsewhere
// the viewer shows them disabled
routes.get("/api/catalog", (request, response) => {
	response.json(
		described(PROCEDURES, { writing: Boolean(request.app.locals.writing) }),
	);
});

// every year at once, by Typesense; without it 503 says how to start it
routes.get("/api/search", async (request, response) => {
	const { search, SearchMissing } = await import("../core/search/typesense.js");
	const word = (name: string) => String(request.query[name] ?? "");
	try {
		response.json(
			await search(word("q"), {
				journal: word("journal"),
				status: word("status"),
				type: word("type"),
				page: Number(word("page")) || 1,
				limit: Number(word("limit")) || 20,
				meaning: word("meaning") === "1" || word("meaning") === "true",
			}),
		);
	} catch (error) {
		if (!(error instanceof SearchMissing)) throw error;
		response.status(503).json({
			error: `search is not running here (${error.message}): docker compose --profile search up -d typesense, then task search:index`,
		});
	}
});

routes.get("/api/map", (_request, response) => {
	response.json(library.mapPresets());
});

// already JSON on disk, sent as it is (a few MB for the bigger presets)
routes.get("/api/map/:preset", (request, response) => {
	const preset = Object.keys(PRESETS).find(
		(name) => name === request.params.preset,
	);
	const made = preset ? library.lawMap(preset) : undefined;
	if (made) response.type("application/json").send(made);
	else notHere(response);
});

// the rest of the dataset (phase 22): statistics, the lists of the source, the work of Sejm,
// court judgments - each a page of lines found by words, as the acts of a year are
const paging = (request: Request) => {
	const { q, offset, limit } = request.query;
	return {
		query: typeof q === "string" ? q : "",
		offset: Number(offset) || 0,
		limit: Number(limit) || 50,
	};
};

routes.get("/api/statistics", (_request, response) => {
	response.json(dataset.statistics());
});

routes.get("/api/lists", (_request, response) => {
	response.json(dataset.lists());
});

routes.get("/api/lists/:name", (request, response) => {
	const found = dataset.list(String(request.params.name));
	if (found === undefined) notHere(response);
	else response.json(found);
});

routes.get("/api/sejm", (_request, response) => {
	response.json(dataset.terms());
});

routes.get("/api/sejm/:term/:kind", (request, response) => {
	const term = String(request.params.term);
	const kind = String(request.params.kind);
	if (
		!/^\d{1,2}$/.test(term) ||
		!(dataset.SEJM_KINDS as readonly string[]).includes(kind)
	) {
		notHere(response);
		return;
	}
	response.json(
		dataset.sejmWork(
			Number(term),
			kind as (typeof dataset.SEJM_KINDS)[number],
			paging(request),
		),
	);
});

routes.get("/api/judgments", (_request, response) => {
	response.json(dataset.judgmentMonths());
});

routes.get("/api/judgments/:year/:month", (request, response) => {
	const month = String(request.params.month);
	if (!/^\d{1,2}$/.test(month)) {
		notHere(response);
		return;
	}
	response.json(
		dataset.judgments(
			Number(request.params.year),
			Number(month),
			paging(request),
		),
	);
});

routes.get("/api/journals", (_request, response) => {
	response.json(library.journals());
});

routes.get("/api/acts/:journal/:year", (request, response) => {
	const { q, offset, limit } = request.query;
	response.json(
		library.acts(journalOf(request) ?? "", Number(request.params.year), {
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
	else {
		// html or pdf; a text from a PDF may carry the mistakes of a recognised scan
		const origin = library.textOrigin(eliOf(request));
		if (origin) response.setHeader("X-Text-From", origin.from);
		response.type("text/markdown; charset=utf-8").send(markdown);
	}
});

routes.get("/api/acts/:journal/:year/:pos/references", (request, response) => {
	const ties = library.references(eliOf(request));
	if (ties) response.json(ties);
	else notHere(response);
});

// what the analysis of the code of law found about it (phase 36, task analyse)
routes.get(
	"/api/acts/:journal/:year/:pos/findings",
	async (request, response) => {
		await dataset.prepareDataset("analysis");
		response.json(dataset.findings(eliOf(request)));
	},
);

// international law (phase 42): the EU's acts by year, one of them, the agreements of the journals
routes.get("/api/eu", (_request, response) => {
	response.json(dataset.euYears());
});
routes.get("/api/eu/act/:celex", async (request, response) => {
	const act = await dataset.euAct(String(request.params.celex));
	if (act) response.json(act);
	else notHere(response);
});
routes.get("/api/eu/:year", async (request, response) => {
	const year = Number(request.params.year);
	const { q, offset, limit, inForce } = request.query;
	await dataset.prepareDataset("eu", String(year));
	response.json(
		dataset.euActs(year, {
			query: typeof q === "string" ? q : "",
			offset: Number(offset) || 0,
			limit: Number(limit) || 50,
			inForce: inForce === "1",
		}),
	);
});
routes.get("/api/agreements", async (request, response) => {
	const { q, type, offset, limit } = request.query;
	await dataset.prepareDataset("agreements");
	response.json(
		dataset.agreements({
			query: typeof q === "string" ? q : "",
			type: typeof type === "string" ? type : "",
			offset: Number(offset) || 0,
			limit: Number(limit) || 50,
		}),
	);
});

// the analysis as a whole: how many findings of each kind, and a page of one kind
routes.get("/api/analysis", (request, response) => {
	const { kind, q, offset, limit } = request.query;
	const summary = dataset.analysis();
	if (!summary) {
		response.status(404).json({ error: "not analysed here: task analyse" });
		return;
	}
	const chosen = dataset.FINDING_KINDS.find((one) => one === kind) ?? "";
	response.json({
		summary,
		page: dataset.findingsOf(chosen, {
			query: typeof q === "string" ? q : "",
			offset: Number(offset) || 0,
			limit: Number(limit) || 50,
		}),
	});
});

// who said what about it in Sejm (phase 35): the days its bill was read on, their statements
routes.get(
	"/api/acts/:journal/:year/:pos/debates",
	async (request, response) => {
		const { debates } = await import("../core/reading/debates.js");
		response.json(await debates(eliOf(request)));
	},
);

routes.get("/api/acts/:journal/:year/:pos/diagram", (request, response) => {
	const diagram = library.diagram(eliOf(request));
	if (diagram) response.type("text/vnd.mermaid; charset=utf-8").send(diagram);
	else notHere(response);
});

routes.get(
	"/api/acts/:journal/:year/:pos/file/:ending",
	(request, response) => {
		const ending = library.ENDINGS.find((one) => one === request.params.ending);
		const path = ending ? library.file(eliOf(request), ending) : undefined;
		if (!path) notHere(response);
		else if (/^https?:/.test(path)) response.redirect(302, path);
		else response.sendFile(resolve(path));
	},
);
