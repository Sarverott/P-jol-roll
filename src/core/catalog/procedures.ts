import * as dataset from "../reading/dataset.js";
import { nearest } from "../reading/embeddings.js";
import * as library from "../reading/library.js";
import type { CatalogScope } from "../vars/interfaces/index.js";
import type { CatalogScope as CatalogTypes } from "../vars/types/index.js";

/*
The catalog: every function of the project once (phase 22, the owner's "full functionality in
every way we run that"). The launcher, the REPL and "task do" offer each of them; the api lists
them at /api/catalog and the viewer shows them; docs/guides/functions.md is the map written
from here (task functions:map), so a hole shows itself.

A reading function answers here through src/core/reading/, the same code as the api and MCP.
A writing function is always its task, so a terminal, a workflow and a local host (Q19, jobs.ts) start
the same code. Data and addresses stay in their handlers; this file only names and asks.
*/

type Parameter = CatalogScope.Parameter;
type Values = CatalogTypes.Values;

// parameters that many functions share
const journal: Parameter = {
	name: "journal",
	title: "journal: DU (Dziennik Ustaw) or MP (Monitor Polski)",
	kind: "choice",
	choices: ["DU", "MP"],
	default: "DU",
};
const year: Parameter = {
	name: "year",
	title: "year",
	kind: "number",
	default: new Date().getFullYear(),
};
const eli: Parameter = {
	name: "eli",
	title: "ELI of an act: journal/year/position, DU/2026/1",
	kind: "text",
	required: true,
};
const query: Parameter = {
	name: "query",
	title: "words to find (empty: everything)",
	kind: "text",
	default: "",
};
const offset: Parameter = {
	name: "offset",
	title: "from which line",
	kind: "number",
	default: 0,
};
const limit = (most: number, by = 20): Parameter => ({
	name: "limit",
	title: most ? `how many (at most ${most})` : "how many (0: all)",
	kind: "number",
	default: by,
	option: "limit",
});
const repository: Parameter = {
	name: "repository",
	title: "which repository of Hugging Face",
	kind: "choice",
	choices: ["dataset", "bucket", "space"],
	default: "dataset",
	positional: true,
};

const text = (values: Values, name: string) => String(values[name] ?? "");
const number = (values: Values, name: string) => Number(values[name] ?? 0);

export const PROCEDURES: CatalogScope.Procedure[] = [
	// read the law: only resources/, the same reading as the api and MCP
	{
		name: "journals",
		group: "read",
		title: "journals gathered here, with their years",
		params: [],
		writes: false,
		read: () => library.journals(),
		ways: { viewer: "#acts", api: "GET /api/journals", mcp: "journals" },
	},
	{
		name: "acts",
		group: "read",
		title: "acts of a year, by words of their titles",
		params: [journal, year, query, offset, limit(500)],
		writes: false,
		read: (values) =>
			library.acts(text(values, "journal"), number(values, "year"), {
				query: text(values, "query"),
				offset: number(values, "offset"),
				limit: number(values, "limit"),
			}),
		ways: {
			viewer: "#acts",
			api: "GET /api/acts/{journal}/{year}",
			mcp: "search_acts",
		},
	},
	{
		name: "meaning",
		group: "read",
		title:
			"acts of every year nearest in meaning to a question (the vectors of task embed, Ollama)",
		params: [
			{
				name: "question",
				title: "the question, in any language",
				kind: "text",
				required: true,
			},
			{ ...journal, choices: ["", "DU", "MP"], default: "" },
			limit(50, 10),
		],
		writes: false,
		read: async (values) =>
			(
				await nearest(text(values, "question"), {
					journal: text(values, "journal"),
					limit: number(values, "limit"),
				})
			)?.map((one) => ({ ...one, title: library.find(one.ELI)?.title })),
		ways: { mcp: "search_meaning" },
	},
	{
		name: "act",
		group: "read",
		title: "one act: its line of the listing, details and the files gathered",
		params: [eli],
		writes: false,
		read: (values) => library.act(text(values, "eli")),
		ways: {
			viewer: "#act/DU/2026/1",
			api: "GET /api/acts/{journal}/{year}/{pos}",
			mcp: "act",
			extension: "the popup",
		},
	},
	{
		name: "act-text",
		group: "read",
		title: "the text of an act, as markdown",
		params: [eli],
		writes: false,
		read: (values) => library.text(text(values, "eli")),
		ways: {
			viewer: "#act/DU/2026/1",
			api: "GET /api/acts/{journal}/{year}/{pos}/text",
			mcp: "act_text",
		},
	},
	{
		name: "act-ties",
		group: "read",
		title: "ties of an act to other acts, as a list or a mermaid flowchart",
		params: [
			eli,
			{
				name: "as",
				title: "as a list or a mermaid flowchart",
				kind: "choice",
				choices: ["list", "mermaid"],
				default: "list",
			},
		],
		writes: false,
		read: (values) =>
			values.as === "mermaid"
				? library.diagram(text(values, "eli"))
				: library.references(text(values, "eli")),
		ways: {
			viewer: "#act/DU/2026/1",
			api: "GET /api/acts/{journal}/{year}/{pos}/references",
			mcp: "act_references",
		},
	},
	{
		name: "search",
		group: "read",
		title: "words in titles and texts of every year (Typesense must run)",
		params: [
			{ ...query, required: true, default: undefined },
			{ ...journal, default: "" },
			{ name: "type", title: "type of act", kind: "text", default: "" },
			{ name: "status", title: "status of act", kind: "text", default: "" },
			{ name: "meaning", title: "by meaning too", kind: "flag" },
		],
		writes: false,
		read: async (values) => {
			const { search } = await import("../search/typesense.js");
			return search(text(values, "query"), {
				journal: text(values, "journal"),
				type: text(values, "type"),
				status: text(values, "status"),
				meaning: Boolean(values.meaning),
			});
		},
		ways: { viewer: "#acts", api: "GET /api/search" },
	},
	{
		name: "maps",
		group: "read",
		title: "maps of the whole law: the presets, and which are made",
		params: [],
		writes: false,
		read: () => library.mapPresets(),
		ways: { viewer: "#map", api: "GET /api/map" },
	},
	{
		name: "statistics",
		group: "read",
		title: "the acts counted year by year: total, by type, by status",
		params: [],
		writes: false,
		read: () => dataset.statistics(),
		ways: {
			viewer: "#statistics",
			api: "GET /api/statistics",
			mcp: "statistics",
		},
	},
	{
		name: "lists",
		group: "read",
		title: "lists of the source: statuses, types, institutions, keywords",
		params: [
			{
				name: "name",
				title: "which list (empty: their names)",
				kind: "text",
				default: "",
			},
		],
		writes: false,
		read: (values) =>
			values.name ? dataset.list(text(values, "name")) : dataset.lists(),
		ways: {
			viewer: "#data",
			api: "GET /api/lists/{name}",
			mcp: "source_list",
		},
	},
	{
		name: "sejm-work",
		group: "read",
		title: "legislative processes and prints of a term of Sejm",
		params: [
			{ name: "term", title: "term of Sejm", kind: "number", default: 10 },
			{
				name: "kind",
				title: "processes or prints",
				kind: "choice",
				choices: ["processes", "prints"],
				default: "processes",
			},
			query,
			offset,
			limit(500),
		],
		writes: false,
		read: (values) =>
			dataset.sejmWork(
				number(values, "term"),
				values.kind === "prints" ? "prints" : "processes",
				{
					query: text(values, "query"),
					offset: number(values, "offset"),
					limit: number(values, "limit"),
				},
			),
		ways: {
			viewer: "#data",
			api: "GET /api/sejm/{term}/{kind}",
			mcp: "sejm_work",
		},
	},
	{
		name: "judgments",
		group: "read",
		title: "court judgments of SAOS, a month at a time",
		params: [
			{
				name: "month",
				title: "month, YYYY-MM (empty: the months gathered)",
				kind: "text",
				default: "",
			},
			query,
			offset,
			limit(500),
		],
		writes: false,
		read: (values) => {
			const [y, m] = text(values, "month").split("-").map(Number);
			if (!y || !m) return dataset.judgmentMonths();
			return dataset.judgments(y, m, {
				query: text(values, "query"),
				offset: number(values, "offset"),
				limit: number(values, "limit"),
			});
		},
		ways: { viewer: "#data", api: "GET /api/judgments/{year}/{month}" },
	},

	// gather from the sources: polite, two requests at a time, started by a person
	{
		name: "gather",
		group: "gather",
		title: "lists and acts of the years, and the files of acts that miss any",
		params: [
			{
				name: "years",
				title: "years (empty: the newest)",
				kind: "number",
				many: true,
				positional: true,
			},
			{
				name: "publisher",
				title: "one journal (empty: every)",
				kind: "choice",
				choices: ["", "DU", "MP"],
				default: "",
				option: "publisher",
			},
			{
				name: "acts",
				title: "the files of acts too",
				kind: "flag",
				option: "acts",
			},
			limit(0, 5),
		],
		writes: true,
		task: "gather",
		ways: { cli: "npm start -- gather", workflows: "daily" },
	},
	{
		name: "gather:changes",
		group: "gather",
		title: "acts changed since the previous such run, or since a day",
		params: [
			{
				name: "since",
				title: "since a day, YYYY-MM-DD (empty: the previous run)",
				kind: "text",
				positional: true,
			},
		],
		writes: true,
		task: "gather:changes",
		ways: { cli: "npm start -- gather --since last", workflows: "daily" },
	},
	{
		name: "gather:everything",
		group: "gather",
		title: "every journal, every year, every file - days of work",
		params: [],
		writes: true,
		task: "gather:everything",
		ways: { cli: "npm start -- gather --all --acts --limit 0" },
	},
	{
		name: "sejm",
		group: "gather",
		title: "work of Sejm: processes and prints of terms",
		params: [
			{
				name: "terms",
				title: "terms (empty: the current)",
				kind: "number",
				many: true,
				positional: true,
			},
			{
				name: "files",
				title: "details and files too",
				kind: "flag",
				option: "files",
			},
			limit(0, 50),
		],
		writes: true,
		task: "sejm",
		ways: { cli: "npm start -- sejm" },
	},
	{
		name: "sittings",
		group: "gather",
		title: "sittings of Sejm: who spoke on each day, and what (phase 35)",
		params: [
			{
				name: "terms",
				title: "terms (empty: the current)",
				kind: "number",
				many: true,
				positional: true,
			},
			{
				name: "files",
				title: "the texts of the statements too",
				kind: "flag",
				option: "files",
			},
			limit(0, 20),
		],
		writes: true,
		task: "sittings",
		ways: { cli: "npm start -- sittings" },
	},
	{
		name: "saos",
		group: "gather",
		title: "court judgments of SAOS, months of years",
		params: [
			{
				name: "years",
				title: "years",
				kind: "number",
				many: true,
				positional: true,
				required: true,
			},
			limit(0, 3),
		],
		writes: true,
		task: "saos",
		ways: { cli: "npm start -- saos" },
	},
	{
		name: "checkup",
		group: "gather",
		title: "a browser visits the websites that show acts of a year",
		params: [
			{ ...year, positional: true },
			limit(0, 6),
			{
				name: "headless",
				title: "without a window",
				kind: "flag",
				option: "headless",
			},
		],
		writes: true,
		task: "checkup",
		ways: { cli: "npm start -- checkup" },
	},

	// process what is gathered: local work, nothing asked from the sources
	{
		name: "seal",
		group: "process",
		title: "checksums of gathered files: write the missing, or check them all",
		params: [
			{
				name: "check",
				title: "check every file against its record",
				kind: "flag",
				option: "check",
			},
		],
		writes: true,
		task: "seal",
		ways: { cli: "npm start -- seal", workflows: "daily" },
	},
	{
		name: "compile",
		group: "process",
		title: "tables of details and references from the raw files",
		params: [],
		writes: true,
		task: "compile",
		ways: { cli: "npm start -- compile", workflows: "daily" },
	},
	{
		name: "text",
		group: "process",
		title: "markdown of the acts from html (and from PDFs)",
		params: [
			{
				name: "pdf",
				title: "from the PDFs of acts without html too",
				kind: "flag",
				option: "pdf",
			},
		],
		writes: true,
		task: "text",
		ways: { cli: "npm start -- text", workflows: "daily" },
	},
	{
		name: "map",
		group: "process",
		title: "the map of the whole law, every preset or one",
		params: [
			{
				name: "preset",
				title: "one preset (empty: every)",
				kind: "choice",
				choices: ["", ...library.mapPresets().map((one) => one.name)],
				default: "",
				positional: true,
			},
		],
		writes: true,
		task: "map",
		ways: { cli: "npm start -- map" },
	},
	{
		name: "stats",
		group: "process",
		title: "the acts counted into the dataset, for the demo",
		params: [],
		writes: true,
		task: "stats",
		ways: { cli: "npm start -- stats" },
	},
	{
		name: "search:index",
		group: "process",
		title: "every act into Typesense, for the search of every year",
		params: [
			{
				name: "texts",
				title: "the beginning of each text too",
				kind: "flag",
				option: "texts",
			},
		],
		writes: true,
		task: "search:index",
		ways: { cli: "npm start -- search index" },
	},
	{
		name: "embed",
		group: "process",
		title: "vectors of the texts by a local model of Ollama",
		params: [
			{
				name: "years",
				title: "years (empty: every)",
				kind: "number",
				many: true,
				positional: true,
			},
		],
		writes: true,
		task: "embed",
		ways: {},
	},
	{
		name: "i18n:collect",
		group: "process",
		title: "the English words of the built pages into the language pack",
		params: [],
		writes: true,
		task: "i18n:collect",
		ways: {},
	},
	{
		name: "i18n:translate",
		group: "process",
		title: "the other language packs, by argostranslate",
		params: [],
		writes: true,
		task: "i18n:translate",
		ways: {},
	},

	// share: Hugging Face, the demo space
	{
		name: "resources:plan",
		group: "share",
		title: "what differs between here and Hugging Face",
		params: [repository],
		writes: false,
		task: "resources:plan",
		ways: { cli: "npm start -- hub plan" },
	},
	{
		name: "resources:pull",
		group: "share",
		title: "take what is on Hugging Face and not here",
		params: [repository],
		writes: true,
		task: "resources:pull",
		ways: { cli: "npm start -- hub pull" },
	},
	{
		name: "resources:push",
		group: "share",
		title: "send what is new here to Hugging Face (HF_TOKEN)",
		params: [repository],
		writes: true,
		task: "resources:push",
		ways: { cli: "npm start -- hub push", workflows: "daily, after a yes" },
	},
	{
		name: "resources:space:refresh",
		group: "share",
		title: "the demo space set to the newest release and built again",
		params: [],
		writes: true,
		task: "resources:space:refresh",
		ways: { workflows: "release" },
	},

	// the project itself
	{
		name: "init",
		group: "project",
		title: "first launch on this machine: tools, .env, secrets",
		params: [],
		writes: true,
		task: "init",
		ways: {},
	},
	{
		name: "check",
		group: "project",
		title: "every check: Biome, the build, the tests",
		params: [],
		writes: false,
		task: "check",
		ways: { workflows: "checks" },
	},
	{
		name: "serve",
		group: "project",
		title: "the api with the website and MCP on 127.0.0.1:8080",
		params: [],
		writes: false,
		task: "serve",
		ways: {},
	},
	{
		name: "desktop",
		group: "project",
		title: "the desktop window around the viewer",
		params: [],
		writes: false,
		task: "desktop",
		ways: {},
	},
	{
		name: "devlog:state",
		group: "project",
		title: "where the project stands, into STATE.md",
		params: [],
		writes: true,
		task: "devlog:state",
		ways: {},
	},
	{
		name: "almanac:recall",
		group: "project",
		title:
			"cases of the almanac that began with these events, and their solutions",
		params: [
			{
				name: "events",
				title: "events, e.g. hub:push",
				kind: "text",
				many: true,
				positional: true,
				required: true,
			},
		],
		writes: false,
		task: "almanac:recall",
		ways: {},
	},
];

export const GROUPS: Record<CatalogTypes.Group, string> = {
	read: "read the law",
	gather: "gather from the sources",
	process: "process what is gathered",
	share: "Hugging Face and the demo",
	project: "the project itself",
};

export const procedure = (name: string) =>
	PROCEDURES.find((one) => one.name === name);
