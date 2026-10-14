import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";
import type { GatheringScope as GatheringTypes } from "../vars/types/index.js";

/*
Raw files of bucket -> tables of dataset. Details of acts of one year become
one file, and their references become edges of a graph: which act changes,
repeals or carries out which.
*/

export const edgesOf = (
	from: string,
	references: GatheringTypes.References = {},
): GatheringScope.Edge[] =>
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
			.readJsonl<GatheringScope.Act>(store.listingPath(publisher, year))
			.flatMap((act) => {
				sum.acts += 1;
				return (
					store.readJson<
						GatheringScope.Act & { references?: GatheringTypes.References }
					>(store.actPath(act, ".json")) ?? []
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
