import { Configuration, HttpCrawler, type HttpCrawlerOptions } from "crawlee";

// sources are open APIs and not websites, so no browser and no disguise are needed -
// requests say who is asking
export const USER_AGENT =
	"P-jol-roll (+https://github.com/Sarverott/P-jol-roll)";

export interface Asked {
	url: string;
	label?: string;
	userData?: Record<string, unknown>;
}

/*
One polite walk over addresses of an API: own name, two requests at a time,
{rate} per minute. Queue of requests lives in memory and dies with the walk -
what is gathered is known from files in resources/, so nothing has to be
resumed from storage/ and a stopped run is simply started again.
*/
export async function crawl(
	requests: Asked[],
	requestHandler: HttpCrawlerOptions["requestHandler"],
	rate: number,
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
			maxRequestsPerMinute: rate,
			// nothing is cut silently - run with everything means every request
			maxRequestsPerCrawl: undefined,
		},
		new Configuration({ persistStorage: false }),
	);
	return crawler.run(requests);
}
