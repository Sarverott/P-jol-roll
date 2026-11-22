import * as library from "../../../core/reading/library.js";

const answer = (value: unknown) => ({
	content: [
		{
			type: "text" as const,
			text: typeof value === "string" ? value : JSON.stringify(value, null, 1),
		},
	],
}); //NOTE: that can be delegated to main.ts in src/mcp/ - universal blocks of code should be reused as often as possible, this is basic optimization of codebase

export default async ({ journal, year, query, offset, limit }) => {
	const page = library.acts(journal, year, { query, offset, limit });
	return answer({
		...page,
		items: page.items.map(({ ELI, title, type, status, textHTML }) => ({
			ELI,
			title,
			type,
			status,
			textHTML,
		})),
	});
};
