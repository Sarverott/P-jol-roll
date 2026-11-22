// a chain of events met before, a line of docs/almanac/patterning/*.json (as in BOS)
export default interface Chain {
	id: string;
	title: string;
	events: string[]; // "hub:push", "hub:429": what happened, in order
	cataclysm?: string; // the event where it broke
	solution?: string;
	seen?: string[]; // where: runs, logs, dates, versions; each counts once more
	topic: string; // the article of docs/almanac/solutions/
	page: string; // the case, docs/almanac/cataclistics/<id>.md - an issue ready for GitHub
}
