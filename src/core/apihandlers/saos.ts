import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHttpRouter } from "crawlee";
import { crawl } from "../crawl.js";
import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";

/*
The law as it is applied: SAOS, System Analizy Orzeczeń Sądowych,
https://www.saos.org.pl - judgments of common courts, Supreme Court,
Constitutional Tribunal and others, with full texts and with acts they refer
to. Its "dump" addresses are made for taking everything. They give judgments
in order of their dates, so they are taken month by month: a month is a
window that stays in place when new judgments arrive.
*/
export const SAOS_API = process.env.SAOS_API ?? "https://www.saos.org.pl/api";
// inside the one dataset (phase 10); its judgments carry their texts, so it has no raw files
export const SAOS_DATASET = join(store.DATASET_DIR, "SAOS");

// the biggest page that API allows
export const PAGE = 100;

// judgments/2020/2020-03.jsonl - every judgment dated in that month, one per line
export const monthPath = (year: number, month: number) =>
	join(
		SAOS_DATASET,
		"judgments",
		String(year),
		`${year}-${String(month).padStart(2, "0")}.jsonl`,
	);

export function monthUrl(year: number, month: number, page: number) {
	const day = (date: Date) => date.toISOString().slice(0, 10);
	const from = day(new Date(Date.UTC(year, month - 1, 1)));
	const to = day(new Date(Date.UTC(year, month, 0)));
	return `${SAOS_API}/dump/judgments?judgmentStartDate=${from}&judgmentEndDate=${to}&pageSize=${PAGE}&pageNumber=${page}`;
}

// months that ended and are not here; the running month would be kept as a half of itself
export function missingMonths(years: number[], today = new Date()) {
	const months = [];
	for (const year of [...years].sort())
		for (let month = 1; month <= 12; month += 1) {
			const ended = new Date(Date.UTC(year, month, 1)) <= today;
			if (ended && !existsSync(monthPath(year, month)))
				months.push({ year, month });
		}
	return months;
}

export async function saos(plan: GatheringScope.SaosPlan) {
	const months = missingMonths(plan.years, plan.today);
	const pages = new Map<string, GatheringScope.Judgment[]>();
	const router = createHttpRouter();

	// month is written when its last page arrives
	router.addDefaultHandler(
		async ({ request, response, json, log, addRequests }) => {
			if (response.statusCode !== 200 || !json)
				throw new Error(`${request.url}: status ${response.statusCode}`);
			const { year, month, page } = request.userData;
			const { items } = json as { items: GatheringScope.Judgment[] };
			const key = `${year}-${month}`;
			const all = [...(pages.get(key) ?? []), ...items];
			pages.set(key, all);
			if (items.length === PAGE) {
				await addRequests([
					{
						url: monthUrl(year, month, page + 1),
						userData: { year, month, page: page + 1 },
					},
				]);
				return;
			}
			await store.saveJsonl(monthPath(year, month), all);
			pages.delete(key);
			log.info(`${year}-${month}: ${all.length} judgments`);
		},
	);

	await crawl(
		months.slice(0, plan.limit || undefined).map(({ year, month }) => ({
			url: monthUrl(year, month, 0),
			userData: { year, month, page: 0 },
		})),
		router,
		plan.rate,
	);
}

/*
The quality of the source (phase 41): SAOS holds judgments dated in years that cannot be -
3013, 2101 - which no month ever asks for, so they would be missed without a word. They are
asked for on their own: every judgment dated after today or before 1918 (Dziennik Ustaw's first
year), kept in judgments/misdated.jsonl as SAOS gives them, and counted in quality.json with a
few to show.
*/
export const misdatedPath = () =>
	join(SAOS_DATASET, "judgments", "misdated.jsonl");
export const qualityPath = () => join(SAOS_DATASET, "quality.json");

const range = (from: string, to: string, page: number) =>
	`${SAOS_API}/dump/judgments?judgmentStartDate=${from}&judgmentEndDate=${to}&pageSize=${PAGE}&pageNumber=${page}`;

export async function quality(plan: { rate: number; today?: Date }) {
	const tomorrow = new Date((plan.today ?? new Date()).getTime() + 86_400_000)
		.toISOString()
		.slice(0, 10);
	const windows = {
		future: [tomorrow, "9999-12-31"],
		past: ["0001-01-01", "1917-12-31"],
	} as const;
	const found: (GatheringScope.Judgment & { window: string })[] = [];
	const router = createHttpRouter();
	router.addDefaultHandler(async ({ request, response, json, addRequests }) => {
		if (response.statusCode !== 200 || !json)
			throw new Error(`${request.url}: status ${response.statusCode}`);
		const { window, page } = request.userData;
		const { items } = json as { items: GatheringScope.Judgment[] };
		found.push(...items.map((item) => ({ ...item, window })));
		if (items.length === PAGE) {
			const [from, to] = windows[window as keyof typeof windows];
			await addRequests([
				{
					url: range(from, to, page + 1),
					userData: { window, page: page + 1 },
				},
			]);
		}
	});
	await crawl(
		Object.entries(windows).map(([window, [from, to]]) => ({
			url: range(from, to, 0),
			userData: { window, page: 0 },
		})),
		router,
		plan.rate,
	);
	await store.saveJsonl(misdatedPath(), found);
	const report = {
		made: new Date().toISOString(),
		misdated: found.length,
		after: found.filter((one) => one.window === "future").length,
		before: found.filter((one) => one.window === "past").length,
		examples: found.slice(0, 10).map((one) => ({
			id: one.id,
			judgmentDate: one.judgmentDate,
			courtType: one.courtType,
			caseNumber: (one.courtCases as { caseNumber?: string }[] | undefined)?.[0]
				?.caseNumber,
		})),
	};
	await store.saveJson(qualityPath(), report);
	return report;
}
