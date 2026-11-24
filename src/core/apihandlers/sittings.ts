import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHttpRouter } from "crawlee";
import { crawl } from "../crawl.js";
import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";
import { pickTerms, SEJM_API, SEJM_BUCKET, SEJM_DATASET } from "./sejm.js";

/*
The work of Sejm as discussion (phase 35): the sittings of a term and what was said on each of
their days, from the same API of Sejm (https://api.sejm.gov.pl/sejm/openapi/).
  /term{n}/proceedings                                  the sittings, each with its days
  /term{n}/proceedings/{sitting}/{date}/transcripts      the statements of a day: who, as whom,
                                                         from which club, when
  /term{n}/proceedings/{sitting}/{date}/transcripts/{num}  the text of one statement (HTML)
Kept as the rest of Sejm's work (phase 10): tables in dataset/sejm/, raw files in bucket/sejm/.
  dataset/sejm/term10/sittings.json
  dataset/sejm/term10/transcripts/31/2025-03-19.json
  bucket/sejm/term10/transcripts/31/2025-03-19/12.html
A day is known from its file, so a run takes only what is missing; a day after today is not
asked for (it has no transcript yet). The acts are tied to the days by the stages of their
processes (reading/debates.ts).
*/

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const sittingsPath = (term: number) =>
	join(SEJM_DATASET, `term${term}`, "sittings.json");
export const dayPath = (term: number, sitting: number, date: string) =>
	join(
		SEJM_DATASET,
		`term${term}`,
		"transcripts",
		`${sitting}`,
		`${date}.json`,
	);
export const statementPath = (
	term: number,
	sitting: number,
	date: string,
	num: number,
) =>
	join(
		SEJM_BUCKET,
		`term${term}`,
		"transcripts",
		`${sitting}`,
		date,
		`${num}.html`,
	);

const transcripts = (term: number, sitting: number, date: string) =>
	`${SEJM_API}/term${term}/proceedings/${sitting}/${date}/transcripts`;

// the days of the sittings of a term that ended by today and are not here
export function missingDays(term: number, today = new Date()) {
	const until = today.toISOString().slice(0, 10);
	return (store.readJson<GatheringScope.Sitting[]>(sittingsPath(term)) ?? [])
		.filter(({ number }) => Number.isInteger(number) && number > 0)
		.flatMap(({ number, dates = [] }) =>
			dates
				.filter((date) => DAY.test(date) && date <= until)
				.map((date) => ({ sitting: number, date })),
		)
		.filter(({ sitting, date }) => !existsSync(dayPath(term, sitting, date)));
}

// the texts of the statements of the days here that are not in the bucket
export function missingStatements(term: number) {
	return (store.readJson<GatheringScope.Sitting[]>(sittingsPath(term)) ?? [])
		.flatMap(({ number, dates = [] }) =>
			dates.map((date) => ({ sitting: number, date })),
		)
		.filter(({ sitting, date }) => DAY.test(date) && Number.isInteger(sitting))
		.flatMap(({ sitting, date }) =>
			(
				store.readJson<GatheringScope.SittingDay>(dayPath(term, sitting, date))
					?.statements ?? []
			)
				.filter(({ num }) => Number.isInteger(num) && num >= 0)
				.map(({ num }) => ({
					url: `${transcripts(term, sitting, date)}/${num}`,
					path: statementPath(term, sitting, date, num),
				})),
		)
		.filter(({ path }) => !existsSync(path));
}

export async function sittings(plan: GatheringScope.SittingsPlan) {
	const terms: number[] = [];
	const lists = createHttpRouter();
	lists.addHandler("terms", async ({ json, addRequests }) => {
		terms.push(...pickTerms(json as GatheringScope.Term[], plan.terms, false));
		await addRequests(
			terms.map((term) => ({
				url: `${SEJM_API}/term${term}/proceedings`,
				label: "sittings",
				userData: { term },
			})),
		);
	});
	lists.addHandler("sittings", async ({ request, json, log }) => {
		const { term } = request.userData;
		await store.saveJson(sittingsPath(term), json);
		log.info(`term ${term}: ${(json as unknown[]).length} sittings`);
	});
	await crawl([{ url: `${SEJM_API}/term`, label: "terms" }], lists, plan.rate);

	// what arrived is written as it came: a day's statements as JSON, a statement's text as HTML
	const files = createHttpRouter();
	files.addDefaultHandler(async ({ request, response, json, body, log }) => {
		const { path } = request.userData;
		if (response.statusCode === 404) {
			log.warning(`${request.url}: source does not have it`);
			return;
		}
		if (response.statusCode !== 200)
			throw new Error(`${request.url}: status ${response.statusCode}`);
		const content = path.endsWith(".json")
			? store.jsonText(json)
			: Buffer.from(body);
		if (!content.length) throw new Error(`${request.url} is empty`);
		await store.writeWhole(path, content);
		log.info(path);
	});

	let left = plan.limit || Number.POSITIVE_INFINITY;
	for (const term of terms) {
		if (left <= 0) break;
		const days = missingDays(term, plan.today)
			.slice(0, left)
			.map(({ sitting, date }) => ({
				url: transcripts(term, sitting, date),
				path: dayPath(term, sitting, date),
			}));
		left -= days.length;
		if (days.length)
			await crawl(
				days.map(({ url, path }) => ({ url, userData: { path } })),
				files,
				plan.rate,
			);
	}
	if (!plan.files) return;
	left = plan.limit || Number.POSITIVE_INFINITY;
	for (const term of terms) {
		if (left <= 0) break;
		const texts = missingStatements(term).slice(0, left);
		left -= texts.length;
		if (texts.length)
			await crawl(
				texts.map(({ url, path }) => ({ url, userData: { path } })),
				files,
				plan.rate,
			);
	}
}
