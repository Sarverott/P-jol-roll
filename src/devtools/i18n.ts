import {
	existsSync,
	globSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { homedir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { parseHTML } from "linkedom";
import { chromium, type Page } from "playwright";
import { readTasks } from "../cli/tasks.js";
import { collect } from "../i18n/dom.js";
import { hookOf, templateOf, translatable } from "../i18n/hooks.js";
import { DOCS_TRANSLATED, languages } from "../i18n/node.js";
import { serve } from "../openapi/server.js";

/*
task i18n:collect - the English of every page, read through the pages themselves (phase 16):
the built introduction (site/) and the viewer (dist/web, served by the api over resources/)
are opened in a headless browser, put in several states, and the runtime of src/i18n in them
collects each text with its hook. The terminal's words are every tr("...") of src/ and the descriptions of the tasks. The
documentation (site/docs) is read as static HTML, only its pages that get translated
(DOCS_TRANSLATED). The result is resources/locales/EN-US.json, the default pack
that task i18n:translate turns into the others. Run after a build of both.
*/

const LOCALES = "resources/locales";
const TYPES: Record<string, string> = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".ico": "image/x-icon",
	".svg": "image/svg+xml",
};

// the site/ folder over http, so the introduction runs as on its website
function serveFolder(folder: string) {
	const server = createServer((request, response) => {
		const path = decodeURIComponent((request.url ?? "/").split("?")[0]);
		// only a file below the folder; anything else gets the page itself
		let file = resolve(
			folder,
			`.${path.endsWith("/") ? `${path}index.html` : path}`,
		);
		const below = relative(folder, file);
		if (below.startsWith("..") || !existsSync(file))
			file = join(folder, "index.html");
		response.setHeader(
			"content-type",
			TYPES[extname(file)] ?? "application/octet-stream",
		);
		response.end(readFileSync(file));
	});
	return new Promise<{ url: string; close: () => void }>((done) =>
		server.listen(0, "127.0.0.1", () =>
			done({
				url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
				close: () => server.close(),
			}),
		),
	);
}

// the browser playwright has, or the newest headless shell in its cache
function executable() {
	if (process.env.CHROMIUM) return process.env.CHROMIUM;
	const cache = join(homedir(), ".cache", "ms-playwright");
	if (!existsSync(cache)) return undefined;
	const shell = readdirSync(cache)
		.filter((name) => name.startsWith("chromium_headless_shell-"))
		.sort()
		.at(-1);
	const path =
		shell &&
		join(
			cache,
			shell,
			"chrome-headless-shell-linux64",
			"chrome-headless-shell",
		);
	return path && existsSync(path) ? path : undefined;
}

const english = (page: Page) =>
	page.evaluate(async () => {
		const i18n = (
			globalThis as unknown as {
				__i18n: {
					use: (code: string) => Promise<void>;
					collect: (root: Node) => Record<string, string>;
				};
			}
		).__i18n;
		await i18n.use("EN-US");
		return i18n.collect(document.body);
	});

const texts: Record<string, string> = {};
const take = (found: Record<string, string>) => Object.assign(texts, found);
const settle = (page: Page) => page.waitForTimeout(1500);

for (const needed of [
	"site/index.html",
	"site/docs/index.html",
	"dist/web/index.html",
])
	if (!existsSync(needed))
		throw new Error(
			`${needed} is missing - task docs:build (or webpage build) and task web:build first`,
		);

const browser = await chromium.launch({ executablePath: executable() });
const page = await browser.newPage();

const intro = await serveFolder(join(process.cwd(), "site"));
await page.goto(`${intro.url}/`);
await settle(page);
take(await english(page));
intro.close();

const { server, url } = await serve({ port: 0 });
await page.goto(`${url}/`);
await settle(page);
take(await english(page));
// an act open: its notes, the ties, the minimap
const first = page.locator(".list-items a").first();
if (await first.count()) {
	await first.click();
	await settle(page);
	take(await english(page));
}
// the map of the whole law
await page.getByText("map of the whole law").click();
await settle(page);
take(await english(page));
server.close();
await browser.close();

// the documentation is static HTML: read without a browser, the pages that are translated
const folders = languages().map((one) => one.code.toLowerCase());
let pages = 0;
for (const path of globSync("**/*.html", { cwd: "site/docs" })) {
	if (folders.some((folder) => path.startsWith(`${folder}/`))) continue;
	if (!DOCS_TRANSLATED.some((pattern) => pattern.test(path))) continue;
	const { document } = parseHTML(readFileSync(join("site/docs", path), "utf8"));
	take(collect(document.body as unknown as Node));
	pages += 1;
}
console.log(`the documentation: ${pages} pages read`);

// the terminal: every tr("...") of src/ and the description of every task (the manual of the CLI)
const said = (text: string) => {
	if (translatable(text)) texts[hookOf(text)] = templateOf(text).template;
};
let words = 0;
for (const path of globSync("src/**/*.ts")) {
	const source = readFileSync(path, "utf8");
	for (const [, double, single] of source.matchAll(
		/\btr\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g,
	)) {
		// the escapes a string of source code can hold, as the string means them
		said(
			(double ?? single).replace(/\\(.)/g, (_all, sign) =>
				sign === "n" ? "\n" : sign,
			),
		);
		words += 1;
	}
}
const tasks = readTasks();
for (const task of tasks) if (task.desc) said(task.desc);
console.log(`the terminal: ${words} texts of tr(), ${tasks.length} tasks`);

const sorted = Object.fromEntries(
	Object.entries(texts).sort(([, a], [, b]) => a.localeCompare(b)),
);
writeFileSync(
	join(LOCALES, "EN-US.json"),
	`${JSON.stringify({ locale: "en-US", name: "English", texts: sorted }, null, "\t")}\n`,
);
console.log(`${LOCALES}/EN-US.json: ${Object.keys(sorted).length} texts`);
process.exit(0);
