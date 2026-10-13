// For more information, see https://crawlee.dev/
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { HttpCrawler } from "crawlee";
import { publisherUrl } from "./eli.js";
import { createRouter } from "./routes.js";
import { DATASET_DIR } from "./store.js";

/*
### usage
- npm start                          -> metadata of the newest year
- npm start -- 2025 2026             -> metadata of these years
- npm start -- --all                 -> metadata of every year since 1918
- npm start -- 2026 --pdf --limit 5  -> and first 5 pdfs that are not gathered yet
- npm start -- --publisher MP        -> Monitor Polski in place of Dziennik Ustaw
*/
const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		all: { type: "boolean", default: false },
		pdf: { type: "boolean", default: false },
		limit: { type: "string", default: "20" },
		publisher: { type: "string", default: "DU" },
	},
});

if (!existsSync(DATASET_DIR)) {
	console.error(
		`${DATASET_DIR} is missing - clone it with: task resources:clone`,
	);
	process.exit(1);
}

// source is open API and not a website, so no browser and no disguise are needed -
// requests say who is asking
const USER_AGENT = "P-jol-roll (+https://github.com/Sarverott/P-jol-roll)";

const crawler = new HttpCrawler({
	requestHandler: createRouter({
		years: positionals.map(Number),
		all: values.all,
		pdf: values.pdf,
		limit: Number(values.limit),
	}),
	additionalMimeTypes: ["application/pdf"],
	preNavigationHooks: [
		(_context, gotOptions) => {
			gotOptions.useHeaderGenerator = false;
			gotOptions.headers = { "user-agent": USER_AGENT };
		},
	],
	useSessionPool: false,
	maxConcurrency: 2,
	maxRequestsPerMinute: 120,
});

await crawler.run([
	{ url: publisherUrl(values.publisher), label: "publisher" },
]);
