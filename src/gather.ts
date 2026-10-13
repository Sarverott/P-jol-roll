import { createHttpRouter, HttpCrawler } from "crawlee";
import {
	type Act,
	ELI_API,
	hasPart,
	type Index,
	type Part,
	type Publisher,
	partUrl,
	pickLists,
	pickPublishers,
	pickYears,
	type YearListing,
	yearUrl,
} from "./eli.js";
import * as store from "./store.js";

export interface GatherPlan {
	publishers: string[]; // empty means every journal
	years: number[]; // empty means only the newest one
	all: boolean; // every year of journal
	parts: Part[]; // files to take for each act, empty means only lists and listings
	limit: number; // how many acts one run may take files for, 0 means no limit
	rate: number; // requests per minute
}

// source is open API and not a website, so no browser and no disguise are needed -
// requests say who is asking
const USER_AGENT = "P-jol-roll (+https://github.com/Sarverott/P-jol-roll)";

function createRouter(plan: GatherPlan) {
	const router = createHttpRouter();
	let actsLeft = plan.limit || Number.POSITIVE_INFINITY;

	// index of API -> every list it names (statuses, types, keywords, institutions, ...)
	router.addHandler("index", async ({ json, log, addRequests }) => {
		const lists = pickLists(json as Index);
		await store.saveJson(store.indexPath(), json);
		log.info(`lists: ${lists.map(({ name }) => name).join(", ")}`);

		await addRequests(
			lists.map(({ name, url }) => ({
				url,
				label: "list",
				userData: { name },
			})),
		);
	});

	// list -> file; list of journals also opens their years
	router.addHandler("list", async ({ request, json, log, addRequests }) => {
		const { name } = request.userData;
		await store.saveJson(store.listPath(name), json);
		log.info(`${name}: ${(json as unknown[]).length} entries`);
		if (name !== "publishers") return;

		for (const { code, years: available, actsCount } of pickPublishers(
			json as Publisher[],
			plan.publishers,
		)) {
			const years = pickYears(available, plan.years, plan.all);
			log.info(`${code}: ${actsCount} acts, gathering years ${years}`);
			await addRequests(
				years.map((year) => ({
					url: yearUrl(code, year),
					label: "year",
					userData: { publisher: code, year },
				})),
			);
		}
	});

	// year -> metadata of its acts, then files of every act that are not here yet
	router.addHandler("year", async ({ request, json, log, addRequests }) => {
		const { publisher, year } = request.userData;
		const { items, count, totalCount } = json as YearListing;
		if (count !== totalCount)
			log.warning(`${publisher}/${year} is cut: ${count} of ${totalCount}`);

		await store.saveListing(publisher, year, items);
		log.info(`${publisher}/${year}: ${items.length} acts listed`);

		const missing = [...items]
			.sort((a, b) => a.pos - b.pos)
			.map((act) => ({
				act,
				parts: plan.parts.filter(
					(part) => hasPart(act, part) && !store.hasPart(act, part),
				),
			}))
			.filter(({ parts }) => parts.length)
			.slice(0, actsLeft);
		actsLeft -= missing.length;

		await addRequests(
			missing.flatMap(({ act, parts }) =>
				parts.map((part) => ({
					url: partUrl(act, part),
					label: "part",
					userData: {
						act: {
							ELI: act.ELI,
							address: act.address,
							publisher: act.publisher,
							year: act.year,
						},
						part,
					},
				})),
			),
		);
	});

	// one file of one act
	router.addHandler("part", async ({ request, json, body, log }) => {
		const { act, part } = request.userData as {
			act: Pick<Act, "ELI" | "address" | "publisher" | "year">;
			part: Part;
		};
		const { ELI } = act;
		const path = store.partPath(act, part);

		if (part === "details" || part === "references") {
			await store.saveJson(path, json);
		} else {
			const content = Buffer.from(body);
			if (!content.length) throw new Error(`${ELI} ${part} is empty`);
			if (part === "pdf" && content.subarray(0, 4).toString() !== "%PDF")
				throw new Error(`${ELI} did not answer with pdf`);
			await store.writeWhole(path, content);
		}
		log.info(`${ELI} ${part}`);
	});

	return router;
}

export async function gather(plan: GatherPlan) {
	const crawler = new HttpCrawler({
		requestHandler: createRouter(plan),
		additionalMimeTypes: ["application/pdf"],
		preNavigationHooks: [
			(_context, gotOptions) => {
				gotOptions.useHeaderGenerator = false;
				gotOptions.headers = { "user-agent": USER_AGENT };
			},
		],
		useSessionPool: false,
		maxConcurrency: 2,
		maxRequestsPerMinute: plan.rate,
		// nothing is cut silently - run with everything means every request
		maxRequestsPerCrawl: undefined,
	});

	return crawler.run([{ url: `${ELI_API}/`, label: "index" }]);
}
