import { join } from "node:path";
import * as store from "../resources/store.js";
import type { GatheringScope } from "../vars/interfaces/index.js";

/*
The international agreements binding Poland (phase 42, Q22) that the journals of the state
published: agreements, conventions, protocols, treaties and the documents ending them, and the
government's statements that one is in force for Poland or for another party. Read from the
listings here (dataset/acts) - nothing is asked of a source - into
dataset/international/agreements.jsonl, one per line, oldest first.
*/

export const AGREEMENT_TYPES = new Set([
	"Umowa międzynarodowa",
	"Konwencja",
	"Protokół",
	"Układ",
	"Traktat",
	"Dokument wypowiedzenia",
	"Oświadczenie rządowe",
]);

export const agreementsPath = () =>
	join(store.DATASET_DIR, "international", "agreements.jsonl");

export type Agreement = {
	ELI: string;
	type: string;
	title: string;
	date: string;
	status: string;
};

export function agreementsOf(acts: GatheringScope.Act[]): Agreement[] {
	return acts
		.filter((act) => AGREEMENT_TYPES.has(String(act.type ?? "")))
		.map((act) => ({
			ELI: act.ELI,
			type: String(act.type),
			title: act.title,
			date: String(act.promulgation ?? act.announcementDate ?? ""),
			status: String(act.status ?? ""),
		}))
		.sort(
			(a, b) =>
				a.date.localeCompare(b.date) ||
				a.ELI.localeCompare(b.ELI, "en", { numeric: true }),
		);
}

export async function international() {
	const acts = store
		.listedYears()
		.flatMap(({ publisher, year }) =>
			store.readJsonl<GatheringScope.Act>(store.listingPath(publisher, year)),
		);
	const found = agreementsOf(acts);
	await store.saveJsonl(agreementsPath(), found);
	const kinds: Record<string, number> = {};
	for (const one of found) kinds[one.type] = (kinds[one.type] ?? 0) + 1;
	return { agreements: found.length, kinds };
}
