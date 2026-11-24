import { Configuration, HttpCrawler, type HttpCrawlerOptions } from "crawlee";
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
	const crawler = new HttpCrawler(
		{
			requestHandler,
			// what arrived is checked by handlers, so every kind of file is let in
			additionalMimeTypes: ["*/*"],
			preNavigationHooks: [
				(_context, gotOptions) => {
					gotOptions.useHeaderGenerator = false;
					gotOptions.headers = { "user-agent": USER_AGENT };
				},
			],
			useSessionPool: false,
			maxConcurrency: 2,
			navigationTimeoutSecs: timeout,
			requestHandlerTimeoutSecs: timeout + 30,
			maxRequestsPerMinute: rate,
			// nothing is cut silently - run with everything means every request
			maxRequestsPerCrawl: undefined,
		},
		new Configuration({ persistStorage: false }),
	);
	const stats = await crawler.run(requests);
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
