/*
The statistics of /api/statistics turned into what the plots and the history draw: acts per
year of one journal or of all, the types and statuses summed, and the whole up to a year.
*/

const add = (into, counts) => {
	for (const [name, value] of Object.entries(counts))
		into[name] = (into[name] ?? 0) + value;
	return into;
};

// the years of a journal ("" for every journal), each with its counts summed
export function yearsOf(statistics, journal = "") {
	const byYear = new Map();
	for (const one of statistics?.years ?? []) {
		if (journal && one.journal !== journal) continue;
		const known = byYear.get(one.year) ?? {
			year: one.year,
			value: 0,
			types: {},
			statuses: {},
		};
		known.value += one.total;
		add(known.types, one.types);
		add(known.statuses, one.statuses);
		byYear.set(one.year, known);
	}
	return [...byYear.values()].sort((a, b) => a.year - b.year);
}

// the counts of every year up to one (all of them without it)
export function upTo(years, last = Number.POSITIVE_INFINITY) {
	const until = years.filter((one) => one.year <= last);
	return {
		acts: until.reduce((sum, one) => sum + one.value, 0),
		types: until.reduce((into, one) => add(into, one.types), {}),
		statuses: until.reduce((into, one) => add(into, one.statuses), {}),
	};
}

export const journalsOf = (statistics) => [
	...new Set((statistics?.years ?? []).map((one) => one.journal)),
];
