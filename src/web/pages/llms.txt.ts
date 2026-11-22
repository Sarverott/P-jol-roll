import { linkOf, site } from "../data/site.ts";

// what a language model needs to use this host (llmstxt.org): what it is, and the ways in
export const GET = () =>
	new Response(
		[
			`# ${site.name}`,
			"",
			`> ${site.description}`,
			"",
			"Read-only: nothing here asks the source or gathers. Not (formally) legal advices - the journal published by the state is the law.",
			"",
			"## Ways in",
			"",
			...site.ways.map((way) => `- [${way.name}](${linkOf(way)}): ${way.what}`),
			"",
		].join("\n"),
		{ headers: { "content-type": "text/plain; charset=utf-8" } },
	);
