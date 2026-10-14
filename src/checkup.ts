import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Browser, ImpitHttpClient } from "@crawlee/impit-client";
import { launchOptions } from "camoufox-js";
import { PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";
import type { Act } from "./eli.js";
import * as store from "./store.js";

export interface CheckupPlan {
	publishers: string[]; // journals to walk, listings of them have to be gathered first
	years: number[];
	frontends: string[]; // names from resources/frontends.json, empty means every one
	limit: number; // how many pages one run may open, 0 means no limit
	headless: boolean;
}

// website that shows acts to people: address with {ELI} {address} {year} {pos},
// one for all journals or one per journal
interface Frontend {
	title: string;
	url: string | Record<string, string>;
}

// one visit of one page, a line of dataset/checkups/{publisher}/{year}.jsonl
export interface Checkup {
	ELI: string;
	frontend: string;
	url: string;
	loadedUrl?: string;
	status?: number;
	title?: string;
	error?: string;
	checkedAt: string;
}

const { readJsonl } = store;

export function frontendUrl(frontend: Frontend, act: Act): string | undefined {
	const template =
		typeof frontend.url === "string"
			? frontend.url
			: frontend.url[act.publisher];
	return template?.replace(/\{(\w+)\}/g, (_match, field) => String(act[field]));
}

// pages that were not visited yet, in order of acts
export function planVisits(plan: CheckupPlan) {
	const frontends: Record<string, Frontend> = JSON.parse(
		readFileSync(join(store.RESOURCES_DIR, "frontends.json"), "utf8"),
	);
	const names = plan.frontends.length ? plan.frontends : Object.keys(frontends);
	const visits = [];

	for (const publisher of plan.publishers) {
		for (const year of plan.years) {
			const done = new Set(
				readJsonl<Checkup>(store.checkupPath(publisher, year)).map(
					({ ELI, frontend }) => `${ELI} ${frontend}`,
				),
			);
			for (const act of readJsonl<Act>(store.listingPath(publisher, year))) {
				for (const frontend of names) {
					const url =
						frontends[frontend] && frontendUrl(frontends[frontend], act);
					if (url && !done.has(`${act.ELI} ${frontend}`))
						visits.push({
							url,
							userData: { ELI: act.ELI, frontend, publisher, year },
						});
				}
			}
		}
	}
	return plan.limit ? visits.slice(0, plan.limit) : visits;
}

// browser walks pages like a person would and writes down what it saw
export async function checkup(plan: CheckupPlan) {
	const save = (
		{ url, userData }: { url: string; userData: Record<string, unknown> },
		seen: Partial<Checkup>,
	) =>
		store.appendLine(
			store.checkupPath(userData.publisher as string, userData.year as number),
			{
				ELI: userData.ELI,
				frontend: userData.frontend,
				url,
				...seen,
				checkedAt: new Date().toISOString(),
			},
		);

	const crawler = new PlaywrightCrawler({
		httpClient: new ImpitHttpClient({ browser: Browser.Firefox }),
		requestHandler: async ({ request, response, page, log }) => {
			const seen = {
				loadedUrl: request.loadedUrl,
				status: response?.status(),
				title: await page.title(),
			};
			await save(request, seen);
			log.info(
				`${request.userData.ELI} ${request.userData.frontend}: ${seen.status}`,
			);
		},
		// page that does not open is a finding too
		failedRequestHandler: async ({ request }, error) => {
			await save(request, { error: error.message });
		},
		maxRequestRetries: 1,
		maxConcurrency: 1,
		maxRequestsPerMinute: 20,
		// Disable the default fingerprint spoofing to avoid conflicts with Camoufox.
		browserPoolOptions: { useFingerprints: false },
		launchContext: {
			launcher: firefox,
			launchOptions: await launchOptions({ headless: plan.headless }),
		},
	});

	return crawler.run(planVisits(plan));
}
