// description of the http api, served at /openapi.json - kept by hand next to routes.ts
const act = {
	type: "object",
	description: "line of the listing of a year, as ELI API of Sejm gave it",
	properties: {
		ELI: { type: "string", example: "DU/2026/1" },
		address: { type: "string", example: "WDU20260000001" },
		title: { type: "string" },
		type: { type: "string" },
		status: { type: "string" },
		textPDF: { type: "boolean" },
		textHTML: { type: "boolean" },
	},
	additionalProperties: true,
};

const eli = [
	{
		name: "journal",
		in: "path",
		required: true,
		schema: { type: "string", example: "DU" },
	},
	{
		name: "year",
		in: "path",
		required: true,
		schema: { type: "integer", example: 2026 },
	},
	{
		name: "pos",
		in: "path",
		required: true,
		schema: { type: "integer", example: 1 },
	},
];

const missing = { description: "not gathered here" };

const paging = [
	{ name: "q", in: "query", schema: { type: "string" } },
	{ name: "offset", in: "query", schema: { type: "integer" } },
	{
		name: "limit",
		in: "query",
		schema: { type: "integer", maximum: 500, default: 50 },
	},
];

export const spec = {
	openapi: "3.1.0",
	info: {
		title: "P_JOL_ROLL",
		version: "0.23.2",
		description:
			"Read-only access to Polish journals of laws gathered by P_JOL_ROLL. It answers from local files only and never asks the source. Live notices of changed files go over socket.io on the same address, and the same reading is served to AI agents as MCP tools at /mcp (streamable http).",
		license: { name: "AGPL-3.0-only" },
	},
	paths: {
		"/api/journals": {
			get: {
				summary: "journals with years gathered here",
				responses: {
					200: {
						description: "journals",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											code: { type: "string" },
											name: { type: "string" },
											years: { type: "array", items: { type: "integer" } },
										},
									},
								},
							},
						},
					},
				},
			},
		},
		"/api/acts/{journal}/{year}": {
			get: {
				summary: "acts of a year, filtered by words of title",
				parameters: [
					eli[0],
					eli[1],
					{ name: "q", in: "query", schema: { type: "string" } },
					{ name: "offset", in: "query", schema: { type: "integer" } },
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", maximum: 500, default: 50 },
					},
				],
				responses: {
					200: {
						description: "one page of acts",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										total: { type: "integer" },
										offset: { type: "integer" },
										items: { type: "array", items: act },
									},
								},
							},
						},
					},
				},
			},
		},
		"/api/acts/{journal}/{year}/{pos}": {
			get: {
				summary: "one act: listing line, details, gathered files",
				parameters: eli,
				responses: {
					200: { description: "the act" },
					404: missing,
				},
			},
		},
		"/api/acts/{journal}/{year}/{pos}/text": {
			get: {
				summary: "markdown of the act, made by task text",
				parameters: eli,
				responses: {
					200: {
						description:
							"markdown; the header X-Text-From says what it was made from: html, or pdf (the text layer of the PDF, recognised from a scan in old years)",
						content: { "text/markdown": { schema: { type: "string" } } },
					},
					404: missing,
				},
			},
		},
		"/api/acts/{journal}/{year}/{pos}/references": {
			get: {
				summary: "ties to other acts named in details",
				parameters: eli,
				responses: {
					200: { description: "ties: from, type, to, date, art" },
					404: missing,
				},
			},
		},
		"/api/search": {
			get: {
				summary:
					"words in titles, keywords and texts of every year, by Typesense; filters by journal, status, type",
				parameters: ["q", "journal", "status", "type", "page", "limit"].map(
					(name) => ({ name, in: "query", schema: { type: "string" } }),
				),
				responses: {
					200: {
						description:
							"total, page, items (ELI, title, type, status, year, snippet), facets",
					},
					503: { description: "Typesense is not running or not filled" },
				},
			},
		},
		"/api/catalog": {
			get: {
				summary:
					"every function of the project (src/core/catalog): name, group, title, parameters, whether it writes, its task, where each interface offers it, and whether this host may start it",
				responses: { 200: { description: "the functions" } },
			},
		},
		"/api/jobs": {
			get: {
				summary:
					"the writing functions started here (only when the api runs with --allow-writing on this machine - Q19; absent elsewhere), from this api's own pages only",
				responses: {
					200: { description: "jobs: id, name, task, args, state, times" },
					403: { description: "not on this machine, or from another origin" },
				},
			},
			post: {
				summary:
					'start a writing function as a job: { "name": "stats", "words": ["2026"], "yes": true } - words as for "task do", yes after a person agreed; one job at a time',
				requestBody: {
					required: true,
					content: { "application/json": { schema: { type: "object" } } },
				},
				responses: {
					202: { description: "the job, running" },
					400: { description: "no yes, or words the function does not take" },
					404: { description: "no such writing function" },
					409: { description: "another job runs" },
					415: { description: "not JSON" },
				},
			},
		},
		"/api/jobs/{id}": {
			get: {
				summary: "one job with the newest lines of its output",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer" },
					},
				],
				responses: {
					200: { description: "the job and its lines" },
					404: { description: "no such job" },
				},
			},
		},
		"/api/statistics": {
			get: {
				summary:
					"the acts counted year by year: total, by type, by status (task stats writes it for the demo)",
				responses: {
					200: {
						description:
							"made, years ([journal, year, total, types, statuses]), types and statuses, the most common first",
					},
				},
			},
		},
		"/api/lists": {
			get: {
				summary:
					"names of the lists of the source: statuses, document_types, institutions, keywords...",
				responses: { 200: { description: "names" } },
			},
		},
		"/api/lists/{name}": {
			get: {
				summary: "one list of the source, as ELI API gave it",
				parameters: [
					{
						name: "name",
						in: "path",
						required: true,
						schema: { type: "string", example: "statuses" },
					},
				],
				responses: { 200: { description: "the list" }, 404: missing },
			},
		},
		"/api/sejm": {
			get: {
				summary:
					"terms of Sejm gathered here, with how many processes and prints each has",
				responses: { 200: { description: "term, processes, prints" } },
			},
		},
		"/api/sejm/{term}/{kind}": {
			get: {
				summary: "legislative processes or prints of a term, by words",
				parameters: [
					{
						name: "term",
						in: "path",
						required: true,
						schema: { type: "integer", example: 10 },
					},
					{
						name: "kind",
						in: "path",
						required: true,
						schema: { type: "string", enum: ["processes", "prints"] },
					},
					...paging,
				],
				responses: {
					200: { description: "total, offset, items" },
					404: missing,
				},
			},
		},
		"/api/judgments": {
			get: {
				summary: "months of court judgments (SAOS) gathered here, YYYY-MM",
				responses: { 200: { description: "months" } },
			},
		},
		"/api/judgments/{year}/{month}": {
			get: {
				summary: "court judgments of a month, by words",
				parameters: [
					eli[1],
					{
						name: "month",
						in: "path",
						required: true,
						schema: { type: "integer", example: 3 },
					},
					...paging,
				],
				responses: { 200: { description: "total, offset, items" } },
			},
		},
		"/api/map": {
			get: {
				summary:
					"presets of the map of the whole law, and whether task map made them",
				responses: { 200: { description: "name, description, made" } },
			},
		},
		"/api/map/{preset}": {
			get: {
				summary:
					"the map of a preset: acts placed by ForceAtlas2 ([ELI, title, x, y, size, kind]) and the ties among them ([from, to, tie])",
				parameters: [
					{
						name: "preset",
						in: "path",
						required: true,
						schema: {
							type: "string",
							enum: [
								"statutes-in-force",
								"statutes",
								"in-force",
								"statutes-in-force-by-meaning",
							],
						},
					},
				],
				responses: { 200: { description: "the map" }, 404: missing },
			},
		},
		"/api/acts/{journal}/{year}/{pos}/diagram": {
			get: {
				summary:
					"the ties as one mermaid flowchart, drawn the same in every interface",
				parameters: eli,
				responses: {
					200: {
						description: "mermaid",
						content: { "text/vnd.mermaid": { schema: { type: "string" } } },
					},
					404: missing,
				},
			},
		},
		"/api/acts/{journal}/{year}/{pos}/file/{ending}": {
			get: {
				summary: "one gathered file of the act",
				parameters: [
					...eli,
					{
						name: "ending",
						in: "path",
						required: true,
						schema: {
							type: "string",
							enum: [
								".pdf",
								".html",
								".json",
								".references.json",
								".struct.json",
								".T.pdf",
								".U.pdf",
							],
						},
					},
				],
				responses: { 200: { description: "the file" }, 404: missing },
			},
		},
	},
};
