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

export const spec = {
	openapi: "3.1.0",
	info: {
		title: "P_JOL_ROLL",
		version: "0.0.1",
		description:
			"Read-only access to Polish journals of laws gathered by P_JOL_ROLL. It answers from local files only and never asks the source. Live notices of changed files go over socket.io on the same address.",
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
						description: "markdown",
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
