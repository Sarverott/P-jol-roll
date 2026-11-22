import type { AlmanacScope } from "../core/vars/interfaces/index.js";

/*
Patterning of the almanac, as BOS has it (blacksmith-organization-system, src/core/patterning.ts):
chains of events met before, each up to the event where it broke (its cataclysm) and what
solved it. Counting which event followed which gives the probable next events of a situation
met again; recall() finds the chains that hold some events, so a log's events lead to a case.
  predict(learn(chains), ["hub:push"]) -> [{ event: "hub:429", p: 0.33 }, ...]
*/

type Chain = AlmanacScope.Chain;
// context (the last one or two events, joined by " → ") -> next event -> count
export type Patterns = Map<string, Map<string, number>>;

export const ORDER = 2;
const contextKey = (events: string[]) => events.join(" → ");

export function learn(chains: Chain[]): Patterns {
	const patterns: Patterns = new Map();
	for (const { events, seen } of chains) {
		// a chain seen several times weighs as much as it was seen
		const weight = Math.max(1, seen?.length ?? 1);
		events.forEach((next, at) => {
			for (let order = 1; order <= ORDER && at - order >= 0; order++) {
				const key = contextKey(events.slice(at - order, at));
				const counts = patterns.get(key) ?? new Map<string, number>();
				counts.set(next, (counts.get(next) ?? 0) + weight);
				patterns.set(key, counts);
			}
		});
	}
	return patterns;
}

// the next events after the given ones, from the longest context met before
export function predict(patterns: Patterns, events: string[]) {
	for (let order = Math.min(ORDER, events.length); order >= 1; order--) {
		const after = contextKey(events.slice(-order));
		const counts = patterns.get(after);
		if (!counts) continue;
		const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
		const next = [...counts]
			.map(([event, count]) => ({ event, p: count / total }))
			.sort((a, b) => b.p - a.p || a.event.localeCompare(b.event));
		return { after, next };
	}
	return { after: contextKey(events.slice(-1)), next: [] };
}

// the chains that hold the given events in this order (not necessarily next to each other),
// the ones that hold more of them first; an event may be given by its start ("hub:")
export function recall(chains: Chain[], events: string[]): Chain[] {
	const held = (chain: Chain) => {
		let at = 0;
		let count = 0;
		for (const event of events) {
			const found = chain.events.findIndex(
				(one, index) =>
					index >= at &&
					(one === event || (event.endsWith(":") && one.startsWith(event))),
			);
			if (found !== -1) {
				count++;
				at = found + 1;
			}
		}
		return count;
	};
	return chains
		.map((chain) => ({ chain, count: held(chain) }))
		.filter(({ count }) => count > 0)
		.sort((a, b) => b.count - a.count)
		.map(({ chain }) => chain);
}
