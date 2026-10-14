import type { Act } from "./eli.js";
import * as store from "./store.js";

/*
Raw files of bucket -> tables of dataset. Details of acts of one year become
one file, and their references become edges of a graph: which act changes,
repeals or carries out which.
*/

// one tie between two acts, a line of dataset/references/{journal}/{year}.jsonl
export interface Edge {
	from: string; // ELI of act whose details name the tie
	type: string; // kind from lists/reference_types.json, "Podstawa prawna"
	to: string; // ELI of the other act
	[field: string]: unknown; // what else API says about the tie: date, art
}

type References = Record<string, { id: string; [field: string]: unknown }[]>;

export const edgesOf = (from: string, references: References = {}): Edge[] =>
	Object.entries(references).flatMap(([type, ties]) =>
		ties.map(({ id, ...rest }) => ({ from, type, to: id, ...rest })),
	);

export const detailsTablePath = (publisher: string, year: number) =>
	`${store.DATASET_DIR}/details/${publisher}/${year}.jsonl`;

export const edgesTablePath = (publisher: string, year: number) =>
	`${store.DATASET_DIR}/references/${publisher}/${year}.jsonl`;

export async function compile() {
	const sum = { acts: 0, details: 0, edges: 0 };
	for (const { publisher, year } of store.listedYears()) {
		const details = store
			.readJsonl<Act>(store.listingPath(publisher, year))
			.flatMap((act) => {
				sum.acts += 1;
				return (
					store.readJson<Act & { references?: References }>(
						store.actPath(act, ".json"),
					) ?? []
				);
			});
		if (!details.length) continue;

		const edges = details.flatMap((act) => edgesOf(act.ELI, act.references));
		await store.saveJsonl(detailsTablePath(publisher, year), details);
		await store.saveJsonl(edgesTablePath(publisher, year), edges);
		sum.details += details.length;
		sum.edges += edges.length;
		console.log(
			`${publisher}/${year}: ${details.length} acts, ${edges.length} ties`,
		);
	}
	return sum;
}
