import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHttpRouter } from "crawlee";
import { crawl } from "../crawl.js";
import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";

/*
The law of the European Union, binding Poland since 2004 (phase 42, Q22): the acts of every
year from the Publications Office of the EU - its SPARQL endpoint for the lists (CELLAR), its
content negotiation for the texts in Polish.
  https://publications.europa.eu/webapi/rdf/sparql          the acts of a year: CELEX, date,
                                                              kind, in force, Polish title, ELI
  http://publications.europa.eu/resource/celex/<CELEX>       its text, as XHTML, in Polish
Kept as the journals are (phase 10): tables in dataset/EU/, raw files in bucket/EU/.
  dataset/EU/acts/2016.jsonl
  bucket/EU/2016/32016R0679.xhtml
The treaties (CELEX 1...) and the secondary law (3...: regulations, directives, decisions and the
rest); the texts only of the acts in force, and never of a corrigendum.
*/

export const EU_SPARQL =
	process.env.EU_SPARQL ?? "https://publications.europa.eu/webapi/rdf/sparql";
export const EU_CELLAR =
	process.env.EU_CELLAR ?? "http://publications.europa.eu/resource";
export const EU_DATASET = join(store.DATASET_DIR, "EU");
export const EU_BUCKET = join(store.BUCKET_DIR, "EU");
const PAGE = 5000;
// treaties carry a slash ("12016M/TXT"): a file is named with "_" in its place
const CELEX = /^[0-9][0-9]{4}[A-Z]{1,2}[0-9A-Z()_/-]{1,20}$/;

export const yearPath = (year: number) =>
	join(EU_DATASET, "acts", `${year}.jsonl`);
export const textPath = (year: number, celex: string) =>
	join(EU_BUCKET, String(year), `${celex.replace(/\//g, "_")}.xhtml`);

// the acts of a year, a page of them; one line per act however many titles it has
export function yearQuery(year: number, offset: number) {
	return `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?celex (SAMPLE(?d) AS ?date) (SAMPLE(?t) AS ?type) (SAMPLE(?f) AS ?force)
  (SAMPLE(?ti) AS ?title) (SAMPLE(?e) AS ?eli) WHERE {
  ?w cdm:resource_legal_id_celex ?celex ; cdm:work_date_document ?d ; cdm:work_has_resource-type ?t .
  OPTIONAL { ?w cdm:resource_legal_in-force ?f }
  OPTIONAL { ?w cdm:resource_legal_eli ?e }
  OPTIONAL { ?x cdm:expression_belongs_to_work ?w ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/POL> ;
    cdm:expression_title ?ti }
  FILTER((STRSTARTS(STR(?celex), "1") || STRSTARTS(STR(?celex), "3")) && YEAR(?d) = ${year})
} GROUP BY ?celex ORDER BY ?celex LIMIT ${PAGE} OFFSET ${offset}`;
}

export const yearUrl = (year: number, offset: number) =>
	`${EU_SPARQL}?query=${encodeURIComponent(yearQuery(year, offset))}`;

type Binding = Record<string, { value: string } | undefined>;

// a row of SPARQL's answer as an act; null when its CELEX is not one
export function actOf(row: Binding): GatheringScope.EuAct | null {
	const celex = row.celex?.value ?? "";
	if (!CELEX.test(celex)) return null;
	const force = row.force?.value;
	return {
		CELEX: celex,
		date: row.date?.value ?? "",
		type: (row.type?.value ?? "").split("/").at(-1) ?? "",
		inForce: force === undefined ? null : force === "1" || force === "true",
		title: row.title?.value ?? "",
		ELI: row.eli?.value ?? "",
	};
}

export async function eu(plan: GatheringScope.EuPlan) {
	const pages = new Map<number, GatheringScope.EuAct[]>();
	const router = createHttpRouter();
	router.addDefaultHandler(
		async ({ request, response, body, log, addRequests }) => {
			// SPARQL answers application/sparql-results+json, which crawlee does not parse for us
			if (response.statusCode !== 200)
				throw new Error(`${request.url}: status ${response.statusCode}`);
			const json = JSON.parse(Buffer.from(body).toString("utf8"));
			const { year, offset } = request.userData;
			const rows = (json as { results: { bindings: Binding[] } }).results
				.bindings;
			const all = [
				...(pages.get(year) ?? []),
				...rows.map(actOf).filter((one) => one !== null),
			];
			pages.set(year, all);
			if (rows.length === PAGE) {
				await addRequests([
					{
						url: yearUrl(year, offset + PAGE),
						userData: { year, offset: offset + PAGE },
					},
				]);
				return;
			}
			await store.saveJsonl(yearPath(year), all);
			log.info(`EU ${year}: ${all.length} acts`);
		},
	);
	await crawl(
		plan.years.map((year) => ({
			url: yearUrl(year, 0),
			userData: { year, offset: 0 },
		})),
		router,
		plan.rate,
		{ headers: { accept: "application/sparql-results+json" }, timeout: 120 },
	);
	if (!plan.texts) return;

	const texts = createHttpRouter();
	texts.addDefaultHandler(async ({ request, response, body, log }) => {
		const { path } = request.userData;
		if (response.statusCode === 404) {
			log.warning(`${request.url}: no Polish text`);
			return;
		}
		if (response.statusCode !== 200)
			throw new Error(`${request.url}: status ${response.statusCode}`);
		const content = Buffer.from(body);
		if (!content.length) throw new Error(`${request.url} is empty`);
		await store.writeWhole(path, content);
		log.info(path);
	});
	const missing = plan.years
		.flatMap((year) =>
			store
				.readJsonl<GatheringScope.EuAct>(yearPath(year))
				.filter((act) => act.inForce && act.type !== "CORRIGENDUM")
				.map((act) => ({
					url: `${EU_CELLAR}/celex/${encodeURIComponent(act.CELEX)}`,
					path: textPath(year, act.CELEX),
				})),
		)
		.filter(({ path }) => !existsSync(path))
		.slice(0, plan.limit || undefined);
	if (missing.length)
		await crawl(
			missing.map(({ url, path }) => ({ url, userData: { path } })),
			texts,
			plan.rate,
			{
				headers: {
					accept: "application/xhtml+xml",
					"accept-language": "pol",
				},
				timeout: 120,
			},
		);
}
