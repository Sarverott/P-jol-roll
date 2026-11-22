import { at, site } from "../data/site.ts";

// crawlers welcome to the pages, not to the api: every answer of it reads files of the host
export const GET = () =>
	new Response(
		[
			"User-agent: *",
			...site.private.map((path) => `Disallow: ${path}`),
			"",
			`Sitemap: ${at("/sitemap.xml")}`,
			"",
		].join("\n"),
		{ headers: { "content-type": "text/plain; charset=utf-8" } },
	);
