import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHttpRouter } from "crawlee";
import { crawl } from "./crawl.js";
import * as store from "./store.js";

/*
The law as it is applied: SAOS, System Analizy Orzeczeń Sądowych,
https://www.saos.org.pl - judgments of common courts, Supreme Court,
Constitutional Tribunal and others, with full texts and with acts they refer
to. Its "dump" addresses are made for taking everything. They give judgments
in order of their dates, so they are taken month by month: a month is a
window that stays in place when new judgments arrive.
*/
export const SAOS_API = process.env.SAOS_API ?? "https://www.saos.org.pl/api";
export const SAOS_DATASET = join(store.RESOURCES_DIR, "saos-dataset");

// the biggest page that API allows
export const PAGE = 100;

export interface SaosPlan {
	years: number[];
	limit: number; // how many months one run may take, 0 means no limit
	rate: number;
	today?: Date;
}

interface Judgment {
	id: number;
	[field: string]: unknown;
}

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

export async function saos(plan: SaosPlan) {
	const months = missingMonths(plan.years, plan.today);
	const pages = new Map<string, Judgment[]>();
	const router = createHttpRouter();

	// month is written when its last page arrives
	router.addDefaultHandler(async ({ request, json, log, addRequests }) => {
		const { year, month, page } = request.userData;
		const { items } = json as { items: Judgment[] };
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
	});

	await crawl(
		months.slice(0, plan.limit || undefined).map(({ year, month }) => ({
			url: monthUrl(year, month, 0),
			userData: { year, month, page: 0 },
		})),
		router,
		plan.rate,
	);
}
