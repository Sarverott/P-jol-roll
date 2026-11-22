import { at } from "../data/site.ts";

// one page: the viewer; its screens and acts live after "#", which crawlers do not follow
export const GET = () =>
	new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>${at("/")}</loc></url>
</urlset>
`,
		{ headers: { "content-type": "application/xml; charset=utf-8" } },
	);
