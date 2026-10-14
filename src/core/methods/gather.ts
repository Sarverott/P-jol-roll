import { existsSync } from "node:fs";
import { createHttpRouter } from "crawlee";
import {
	type Act,
	type ActFile,
	type ActText,
	CHANGES_PAGE,
	type Changes,
	changesUrl,
	ELI_API,
	filesOf,
	type Index,
	type Part,
	type Publisher,
	pickLists,
	pickPublishers,
	pickYears,
	type YearListing,
	yearUrl,
} from "../apihandlers/eli.js";
import { crawl } from "../crawl.js";
import * as store from "../resources/store.js";

export interface GatherPlan {
	publishers: string[]; // empty means every journal
	years: number[]; // empty means only the newest one
	all: boolean; // every year of journal
	parts: Part[]; // files to take for each act, empty means only lists and listings
	limit: number; // how many acts one run may take files for, 0 means no limit
	rate: number; // requests per minute
	since?: string; // only acts changed since this date, or "last" for date of previous such run
}

// what one year has to give: all its acts, or only these that changed
interface YearWork {
	publisher: string;
	year: number;
	changed?: Set<string>; // addresses
}

// names of files are built from answers of API - nothing of them may leave its directory
function trusted(act: Act) {
	if (!/^[A-Z_]+$/.test(act.publisher) || !/^\w+$/.test(act.address))
		throw new Error(`act with unusable name: ${JSON.stringify(act.ELI)}`);
	return act;
}

/*
First walk: index -> every list it names -> listings of years. With "since"
years are not walked - API is asked which acts changed, and only years of
these acts are listed again.
*/
async function survey(plan: GatherPlan): Promise<YearWork[]> {
	const router = createHttpRouter();
	const work = new Map<string, YearWork>();
	const since =
		plan.since === "last"
			? store.readJson<{ since: string }>(store.changesPath())?.since
			: plan.since;
	if (plan.since && !since)
		throw new Error(
			'nothing to continue from: give a date, "--since 2026-10-01"',
		);
	let newest = since ?? "";

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

		if (since) {
			await addRequests([{ url: changesUrl(since, 0), label: "changes" }]);
			return;
		}
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

	// page of changed acts -> years they belong to, and the next page
	router.addHandler("changes", async ({ json, log, addRequests }) => {
		const { items, offset, totalCount } = json as Changes;
		for (const act of items) {
			const wanted =
				!plan.publishers.length || plan.publishers.includes(act.publisher);
			if (String(act.changeDate) > newest) newest = String(act.changeDate);
			if (!wanted) continue;

			const key = `${act.publisher}/${act.year}`;
			if (!work.has(key)) {
				const { publisher, year } = trusted(act);
				work.set(key, { publisher, year, changed: new Set() });
				await addRequests([
					{
						url: yearUrl(act.publisher, act.year),
						label: "year",
						userData: { publisher: act.publisher, year: act.year },
					},
				]);
			}
			work.get(key)?.changed?.add(act.address);
		}
		log.info(
			`changed since ${since}: ${offset + items.length} of ${totalCount}`,
		);
		if (items.length === CHANGES_PAGE)
			await addRequests([
				{
					url: changesUrl(since as string, offset + items.length),
					label: "changes",
				},
			]);
	});

	// year -> metadata of its acts
	router.addHandler("year", async ({ request, json, log }) => {
		const { publisher, year } = request.userData;
		const { items, count, totalCount } = json as YearListing;
		if (count !== totalCount)
			log.warning(`${publisher}/${year} is cut: ${count} of ${totalCount}`);

		await store.saveListing(publisher, year, items.map(trusted));
		log.info(`${publisher}/${year}: ${items.length} acts listed`);
		if (!since) work.set(`${publisher}/${year}`, { publisher, year });
	});

	await crawl([{ url: `${ELI_API}/`, label: "index" }], router, plan.rate);

	const years = [...work.values()].sort(
		(a, b) => a.publisher.localeCompare(b.publisher) || a.year - b.year,
	);
	// remembered only after files of changed acts are taken, see gather()
	return Object.assign(years, { newest });
}

/*
Second walk, one year at a time: files of acts that are not here yet. File
is "here" when it lies in bucket directory or when its checksum is recorded
in dataset - so a machine that has only the dataset does not ask Sejm again
for what is already kept in the bucket.
*/
async function gatherYear(plan: GatherPlan, work: YearWork, left: number) {
	const { publisher, year, changed } = work;
	const records = store.sealed(publisher, year);
	const taken = new Set<string>();
	const acts = store
		.readJsonl<Act>(store.listingPath(publisher, year))
		.filter((act) => !changed || changed.has(act.address));

	const missing = (act: Act, parts: Part[]) => {
		const texts = store.readJson<{ texts?: ActText[] }>(
			store.actPath(act, ".json"),
		)?.texts;
		return parts
			.flatMap((part) => filesOf(act, part, texts))
			.filter(({ part, suffix }) => {
				const path = store.bucketPath(act, suffix);
				if (taken.has(path)) return false;
				// published text of changed act stays what it was, everything else is taken again
				if (changed) return part !== "pdf" || !records.has(path);
				return !records.has(path) && !existsSync(store.actPath(act, suffix));
			});
	};

	const take = async (wanted: { act: Act; files: ActFile[] }[]) => {
		const router = createHttpRouter();
		router.addDefaultHandler(async ({ request, response, json, body, log }) => {
			const { act, file } = request.userData as { act: Act; file: ActFile };
			const path = store.bucketPath(act, file.suffix);
			if (response.statusCode === 404) {
				log.warning(`${act.ELI} ${file.part}: source does not have it`);
				return;
			}
			if (response.statusCode !== 200)
				throw new Error(
					`${act.ELI} ${file.part}: status ${response.statusCode}`,
				);

			let content: string | Buffer;
			if (file.suffix.endsWith(".json")) content = store.jsonText(json);
			else {
				content = Buffer.from(body);
				if (!content.length)
					throw new Error(`${act.ELI} ${file.part} is empty`);
				const pdf = content.subarray(0, 4).toString() === "%PDF";
				if (file.suffix.endsWith(".pdf") && !pdf)
					throw new Error(`${act.ELI} ${file.part} did not answer with pdf`);
			}
			const written = await store.writeWhole(
				store.actPath(act, file.suffix),
				content,
			);
			taken.add(path);
			if (records.get(path)?.sha256 !== written.sha256)
				await store.appendLine(store.manifestPath(publisher, year), {
					path,
					...written,
					url: file.url,
					gatheredAt: new Date().toISOString(),
				} satisfies store.FileRecord);
			log.info(
				`${act.ELI} ${file.part}${file.part === "texts" ? file.suffix : ""}`,
			);
		});

		const requests = wanted.flatMap(({ act, files }) =>
			files.map((file) => ({
				url: file.url,
				userData: {
					act: {
						ELI: act.ELI,
						address: act.address,
						publisher: act.publisher,
						year: act.year,
					},
					file,
				},
			})),
		);
		if (requests.length) await crawl(requests, router, plan.rate);
	};

	const chosen = acts
		.map((act) => ({ act, files: missing(act, plan.parts) }))
		.filter(({ files }) => files.length)
		.slice(0, left);
	await take(chosen);

	// other texts of act are named in its details, which could have arrived a moment ago
	if (plan.parts.includes("texts"))
		await take(
			chosen
				.map(({ act }) => ({ act, files: missing(act, ["texts"]) }))
				.filter(({ files }) => files.length),
		);
	return chosen.length;
}

export async function gather(plan: GatherPlan) {
	// acts that changed are asked for the files that can change, when no other were named
	const parts: Part[] =
		plan.since && !plan.parts.length ? ["details", "references"] : plan.parts;
	const years = await survey(plan);
	let left = plan.limit || Number.POSITIVE_INFINITY;

	if (parts.length)
		for (const work of years) {
			if (left <= 0) break;
			left -= await gatherYear({ ...plan, parts }, work, left);
		}

	// next "--since last" starts from the newest change that was seen - only when nothing was cut by limit
	const { newest } = years as typeof years & { newest: string };
	if (plan.since && newest && left > 0)
		await store.saveJson(store.changesPath(), { since: newest });
}
