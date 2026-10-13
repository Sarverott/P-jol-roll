import { createHttpRouter } from "crawlee";
import {
	type Act,
	type Publisher,
	pdfUrl,
	pickYears,
	type YearListing,
	yearUrl,
} from "./eli.js";
import { hasPdf, saveListing, savePdf } from "./store.js";

export interface Plan {
	years: number[]; // empty means only the newest one
	all: boolean; // every year of publisher
	pdf: boolean; // texts too, not only metadata
	limit: number; // how many pdfs one run may take
}

export function createRouter(plan: Plan) {
	const router = createHttpRouter();
	let pdfsLeft = plan.limit;

	// journal -> its years
	router.addHandler("publisher", async ({ json, log, addRequests }) => {
		const { code, years: available, actsCount } = json as Publisher;
		const years = pickYears(available, plan.years, plan.all);
		const unknown = plan.years.filter((year) => !available.includes(year));
		if (unknown.length) log.warning(`${code} has no years ${unknown}`);
		log.info(`${code}: ${actsCount} acts, gathering years ${years}`);

		await addRequests(
			years.map((year) => ({
				url: yearUrl(code, year),
				label: "year",
				userData: { publisher: code, year },
			})),
		);
	});

	// year -> metadata of its acts, then their pdfs
	router.addHandler("year", async ({ request, json, log, addRequests }) => {
		const { publisher, year } = request.userData;
		const { items, count, totalCount } = json as YearListing;
		if (count !== totalCount)
			log.warning(`${publisher}/${year} is cut: ${count} of ${totalCount}`);

		await saveListing(publisher, year, items);
		log.info(`${publisher}/${year}: ${items.length} acts listed`);
		if (!plan.pdf) return;

		const missing = items
			.filter((act) => act.textPDF && !hasPdf(act))
			.sort((a, b) => a.pos - b.pos)
			.slice(0, pdfsLeft);
		pdfsLeft -= missing.length;

		await addRequests(
			missing.map(({ ELI, address }) => ({
				url: pdfUrl({ ELI }),
				label: "pdf",
				userData: { act: { ELI, address, publisher, year } },
			})),
		);
	});

	router.addHandler("pdf", async ({ request, body, log }) => {
		const act = request.userData.act as Pick<
			Act,
			"ELI" | "address" | "publisher" | "year"
		>;
		if (!Buffer.isBuffer(body) || body.subarray(0, 4).toString() !== "%PDF")
			throw new Error(`${act.ELI} did not answer with pdf`);

		await savePdf(act, body);
		log.info(`${act.ELI}: ${body.length} bytes`);
	});

	return router;
}
