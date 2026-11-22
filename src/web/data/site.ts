import { parse } from "yaml";
import { readText } from "./files.ts";

/*
The website's own data (site.yaml) and its address: the host's own (PUBLIC_SITE) or the demo.
Every page and every file for machines (robots.txt, sitemap.xml, llms.txt) reads it from here.
*/

type Way = { name: string; what: string; path?: string; url?: string };
export type Site = {
	name: string;
	title: string;
	description: string;
	theme: string;
	demo: string;
	card: { image: string; width: number; height: number; alt: string };
	private: string[];
	ways: Way[];
};

export const site: Site = parse(readText("src/web/data/site.yaml"));

// the whole address of the host, without a slash at the end
export const origin = (
	(import.meta.env.PUBLIC_SITE as string | undefined) ?? site.demo
).replace(/\/$/, "");

export const at = (path: string) => `${origin}${path}`;

// a way in: an address of this host, or one elsewhere
export const linkOf = (way: Way) => way.url ?? at(way.path ?? "/");
