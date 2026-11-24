import { existsSync } from "node:fs";
import { join } from "node:path";
import { USER_AGENT } from "../crawl.js";
import * as store from "../resources/store.js";

/*
Public tenders (phase 43, Q23): what the state buys, day by day.
  e-Zamówienia, the Biuletyn Zamówień Publicznych (ezamowienia.gov.pl/mo-board/api/v1/notice):
    every notice of a day, by its type; the API ignores its page number, so a window of time
    that comes back full (PAGE notices) is split in two, until each half is whole
  TED, the EU's Tenders Electronic Daily (api.ted.europa.eu/v3/notices/search): every notice of
    a day whose buyer is in Poland, page by page
Kept by day, the notice's own HTML (BZP) in the bucket:
  dataset/tenders/BZP/2026/2026-11-20.jsonl
  dataset/tenders/TED/2026/2026-11-20.jsonl
  bucket/tenders/BZP/2026/2026-11-20/<objectId>.html
A day is known from its file; a day not ended yet is not taken. One request at a time, three seconds
apart, a minute's pause when refused for asking too much: these are servers of the state and of
the EU. A day that fails is said and left for the next run.
*/

export const BZP_API =
	process.env.BZP_API ?? "https://ezamowienia.gov.pl/mo-board/api/v1";
export const TED_API = process.env.TED_API ?? "https://api.ted.europa.eu/v3";
export const TENDERS_DATASET = join(store.DATASET_DIR, "tenders");
export const TENDERS_BUCKET = join(store.BUCKET_DIR, "tenders");
const PAGE = 100;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
// the kinds of notices of the Biuletyn (the API asks for one at a time)
export const BZP_TYPES = [
	"ContractNotice",
	"TenderResultNotice",
	"TenderPlanNotice",
	"AgreementUpdateNotice",
	"CompetitionNotice",
	"CompetitionResultNotice",
	"NoticeUpdateNotice",
	"ContractPerformingNotice",
];

export const dayPath = (source: "BZP" | "TED", day: string) =>
	join(TENDERS_DATASET, source, day.slice(0, 4), `${day}.jsonl`);
export const noticePath = (day: string, id: string) =>
	join(TENDERS_BUCKET, "BZP", day.slice(0, 4), day, `${id}.html`);

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

// a refusal for too many requests (403 or 429 of their firewalls) waited out a minute, three times
async function ask(url: string, init: RequestInit = {}, wait = 3000) {
	for (let attempt = 1; ; attempt++) {
		await pause(wait);
		const answer = await fetch(url, {
			...init,
			headers: {
				"user-agent": USER_AGENT,
				accept: "application/json",
				...(init.headers ?? {}),
			},
			signal: AbortSignal.timeout(120_000),
		});
		if (answer.ok) return answer.json();
		if ((answer.status === 403 || answer.status === 429) && attempt <= 3) {
			await pause(wait ? 60_000 : 0);
			continue;
		}
		throw new Error(`${url.split("?")[0]}: status ${answer.status}`);
	}
}

type Notice = Record<string, unknown> & {
	objectId?: string;
	htmlBody?: string;
};

// one type of a window of time; split in two while it comes back full
async function window(
	type: string,
	from: Date,
	to: Date,
	wait: number,
): Promise<Notice[]> {
	const iso = (date: Date) => date.toISOString().slice(0, 19);
	const found = (await ask(
		`${BZP_API}/notice?NoticeType=${type}&PublicationDateFrom=${iso(from)}&PublicationDateTo=${iso(to)}&PageSize=${PAGE}`,
		{},
		wait,
	)) as Notice[];
	if (found.length < PAGE || to.getTime() - from.getTime() < 60_000)
		return found;
	const middle = new Date((from.getTime() + to.getTime()) / 2);
	return [
		...(await window(type, from, middle, wait)),
		...(await window(type, new Date(middle.getTime() + 1000), to, wait)),
	];
}

export async function bzpDay(day: string, wait = 1000) {
	const from = new Date(`${day}T00:00:00Z`);
	const to = new Date(`${day}T23:59:59Z`);
	const all = new Map<string, Notice>();
	for (const type of BZP_TYPES) {
		const found = await window(type, from, to, wait).catch((error: Error) => {
			// a type the Biuletyn does not know any more: said, and the others taken
			if (/status 400/.test(error.message)) return [];
			throw error;
		});
		for (const notice of found)
			all.set(String(notice.objectId ?? notice.bzpNumber), notice);
	}
	const notices = [...all.values()];
	for (const notice of notices) {
		const id = String(notice.objectId ?? "");
		if (notice.htmlBody && /^[\w-]{1,80}$/.test(id))
			await store.writeWhole(noticePath(day, id), notice.htmlBody);
		delete notice.htmlBody;
	}
	await store.saveJsonl(dayPath("BZP", day), notices);
	return notices.length;
}

export async function tedDay(day: string, wait = 1000) {
	const notices: Record<string, unknown>[] = [];
	for (let page = 1; page <= 200; page++) {
		const said = (await ask(
			`${TED_API}/notices/search`,
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					query: `buyer-country=POL AND publication-date=${day.replace(/-/g, "")}`,
					fields: [
						"publication-number",
						"publication-date",
						"notice-type",
						"notice-title",
						"buyer-name",
						"buyer-city",
						"classification-cpv",
						"total-value",
					],
					limit: 250,
					page,
				}),
			},
			wait,
		)) as { notices?: Record<string, unknown>[]; totalNoticeCount?: number };
		const found = said.notices ?? [];
		notices.push(...found.map(({ links: _links, ...notice }) => notice));
		if (found.length < 250 || notices.length >= (said.totalNoticeCount ?? 0))
			break;
	}
	await store.saveJsonl(dayPath("TED", day), notices);
	return notices.length;
}

// the days asked for that ended and are not here
export function missingDays(
	days: string[],
	source: "BZP" | "TED",
	today = new Date(),
) {
	const until = today.toISOString().slice(0, 10);
	return days.filter(
		(day) => DAY.test(day) && day < until && !existsSync(dayPath(source, day)),
	);
}

// "2026-11" -> every day of it; "2026-11-20" -> that day
export function daysOf(given: string[]) {
	return given.flatMap((one) => {
		if (DAY.test(one)) return [one];
		const month = /^(\d{4})-(\d{2})$/.exec(one);
		if (!month) return [];
		const last = new Date(
			Date.UTC(Number(month[1]), Number(month[2]), 0),
		).getUTCDate();
		return Array.from(
			{ length: last },
			(_, index) => `${one}-${String(index + 1).padStart(2, "0")}`,
		);
	});
}

export async function tenders(plan: {
	days: string[];
	sources: ("BZP" | "TED")[];
	limit: number;
	today?: Date;
	wait?: number;
}) {
	const sum: Record<string, number> = {};
	const failed: string[] = [];
	for (const source of plan.sources) {
		const days = missingDays(daysOf(plan.days), source, plan.today).slice(
			0,
			plan.limit || undefined,
		);
		for (const day of days)
			try {
				sum[`${source} ${day}`] = await (source === "BZP" ? bzpDay : tedDay)(
					day,
					plan.wait ?? 3000,
				);
			} catch (error) {
				failed.push(`${source} ${day}: ${(error as Error).message}`);
			}
	}
	return { sum, failed };
}
