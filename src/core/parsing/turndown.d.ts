// turndown comes without types - only what src/text.ts uses is described here
declare module "turndown" {
	export default class TurndownService {
		constructor(options?: Record<string, string>);
		remove(filter: string | string[]): this;
		addRule(
			key: string,
			rule: {
				filter: string | string[];
				replacement: (content: string) => string;
			},
		): this;
		turndown(html: string): string;
	}
}
