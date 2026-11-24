import { randomUUID } from "node:crypto";
import {
	Configuration,
	HttpCrawler,
	type HttpCrawlerOptions,
	RequestQueue,
} from "crawlee";
import log from "./logging/setup.js";
import type { GatheringScope } from "./vars/interfaces/index.js";

// sources are open APIs and not websites, so no browser and no disguise are needed -
// requests say who is asking
export const USER_AGENT =
	"P-jol-roll (+https://github.com/Sarverott/P-jol-roll)";

/*
One polite walk over addresses of an API: own name, two requests at a time,
{rate} per minute. Queue of requests lives in memory and dies with the walk -
what is gathered is known from files in resources/, so nothing has to be
resumed from storage/ and a stopped run is simply started again.
*/
export async function crawl(
	requests: GatheringScope.Asked[],
	requestHandler: HttpCrawlerOptions["requestHandler"],
	rate: number,
	// seconds one answer may take: 30 by default; the Sejm's transcripts of a day take longer (phase 41)
	// tolerate: a request that failed every retry is a warning, not the run's failure - when
	// something else takes its place (the Sejm's day as a PDF)
	{
		timeout = 30,
		tolerate = false,
	}: { timeout?: number; tolerate?: boolean } = {},
) {
	// a queue of its own: walks one after another in one process (the Sejm's days, then their
	// PDFs; SAOS's months, then its misdated judgments) do not share what the first one left
	const config = new Configuration({ persistStorage: false });
	const requestQueue = await RequestQueue.open(`walk-${randomUUID()}`, {
		config,
	});
	const crawler = new HttpCrawler(
		{
			requestHandler,
			// what arrived is checked by handlers, so every kind of file is let in
			additionalMimeTypes: ["*/*"],
			preNavigationHooks: [
				(_context, gotOptions) => {
					gotOptions.useHeaderGenerator = false;
					// JSON first, anything after: crawlee's default asks for HTML, and SAOS answers
					// that with 406 "unsupported media type" (phase 41) - every source here is an API
					gotOptions.headers = {
						"user-agent": USER_AGENT,
						accept: "application/json, */*;q=0.8",
					};
				},
			],
			useSessionPool: false,
			maxConcurrency: 2,
			navigationTimeoutSecs: timeout,
			requestHandlerTimeoutSecs: timeout + 30,
			maxRequestsPerMinute: rate,
			// nothing is cut silently - run with everything means every request
			maxRequestsPerCrawl: undefined,
			requestQueue,
		},
		config,
	);
	const stats = await crawler.run(requests);
	await requestQueue.drop();
	// a request that failed every retry is logged by crawlee above; the run must not end as if
	// all went well (gather:changes did, when the API refused its "since" with 400)
	if (stats.requestsFailed && tolerate)
		log.warning(
			`${stats.requestsFailed} request(s) failed - tried another way`,
		);
	else if (stats.requestsFailed) {
		log.error(
			`${stats.requestsFailed} request(s) failed - see the errors above`,
			{
				failed: stats.requestsFailed,
				finished: stats.requestsFinished,
			},
		);
		process.exitCode = 1;
	}
	return stats;
}
