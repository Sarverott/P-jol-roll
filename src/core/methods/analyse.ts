import { join } from "node:path";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";
import { edgesTablePath } from "./compile.js";

/*
The code of law analysed (phase 36, task analyse): every act in force checked against its ties,
with no model - what the data of the source says exactly - each finding with the improvement it
suggests. Read from the listings (dataset/acts) and the ties (dataset/references, task compile);
written to dataset/analysis/:
  findings.jsonl   a finding a line, sorted by act
  summary.json     how many acts were read, how many in force, findings of each kind
An act that only amends others ("o zmianie", "zmieniające") is left out: its references are
spent, its changes live in the act it amended, which is checked. The kinds:
  basis-repealed      its legal basis ("Podstawa prawna") is an act repealed or expired: it may
                      have lost force with it, unless kept by transitional provisions
  reference-repealed  it refers ("Odesłania") to an act repealed: the reference points to nothing
                      in force; the act that repealed it is named where the ties say so
  consolidation-due   amended CONSOLIDATE times or more since its last consolidated text (or ever,
                      without one): a new consolidated text would gather them
  tribunal            judged by the Constitutional Tribunal ("Orzeczenie TK") and not amended since
                      the judgment was published: the judgment may wait for the legislator
*/

export const analysisPath = (name: "findings.jsonl" | "summary.json") =>
	join(store.DATASET_DIR, "analysis", name);

// the statuses of an act in force, and of one that is not any more
export const IN_FORCE = new Set([
	"obowiązujący",
	"akt posiada tekst jednolity",
]);
export const GONE = new Set([
	"uchylony",
	"uznany za uchylony",
	"uchylony wykazem",
	"wygaśnięcie aktu",
	"nieobowiązujący - uchylona podstawa prawna",
	"nieobowiązujący - przyczyna nieustalona",
]);
const CONSOLIDATE = Number(process.env.ANALYSE_CONSOLIDATE) || 5;
// kinds of acts a consolidated text is made for, and a judgment of the Tribunal answered in
const CONSOLIDATED = new Set(["Ustawa", "Rozporządzenie", "Dekret", "Kodeks"]);

// an act that only amends others: consolidated and judged in them, not on its own
const AMENDING = /\bo zmianie\b|\bzmieniając[aey]\b/i;

type Known = { title: string; status: string; type: string; date: string };

export function analyse(
	acts: GatheringScope.Act[],
	edges: GatheringScope.Edge[],
): { findings: ReadingScope.Finding[]; summary: ReadingScope.Analysis } {
	const known = new Map<string, Known>(
		acts.map((act) => [
			act.ELI,
			{
				title: act.title,
				status: String(act.status ?? ""),
				type: String(act.type ?? ""),
				date: String(act.promulgation ?? act.announcementDate ?? ""),
			},
		]),
	);
	const from = new Map<string, GatheringScope.Edge[]>();
	for (const edge of edges) {
		const list = from.get(edge.from) ?? [];
		list.push(edge);
		from.set(edge.from, list);
	}
	const ties = (eli: string, ...types: string[]) =>
		(from.get(eli) ?? []).filter((edge) => types.includes(edge.type));
	// the consolidated texts of an act: told from either side
	const consolidations = new Map<string, string[]>();
	for (const edge of edges)
		if (edge.type === "Tekst jednolity dla aktu") {
			const list = consolidations.get(edge.to) ?? [];
			list.push(edge.from);
			consolidations.set(edge.to, list);
		}
	const successor = (eli: string) =>
		ties(eli, "Akty uchylające", "Uchylenia wynikające z")[0]?.to;
	const dateOf = (edge: GatheringScope.Edge) =>
		String(edge.date ?? known.get(edge.to)?.date ?? "");

	const findings: ReadingScope.Finding[] = [];
	let inForce = 0;
	for (const [eli, act] of known) {
		if (!IN_FORCE.has(act.status)) continue;
		inForce++;
		if (AMENDING.test(act.title)) continue;
		const finding = (one: {
			kind: ReadingScope.Finding["kind"];
			proposal: string;
			to?: string;
			status?: string;
			successor?: string;
			count?: number;
			since?: string;
		}) => findings.push({ ELI: eli, title: act.title, ...one });

		for (const edge of ties(eli, "Podstawa prawna")) {
			const basis = known.get(edge.to);
			if (!basis || !GONE.has(basis.status)) continue;
			const next = successor(edge.to);
			finding({
				kind: "basis-repealed",
				to: edge.to,
				status: basis.status,
				...(next ? { successor: next } : {}),
				proposal: `Its legal basis ${edge.to} is ${basis.status}${next ? ` (by ${next})` : ""}: check whether transitional provisions keep it in force; if not, repeal it or issue it again on a basis in force.`,
			});
		}

		const referred = new Set<string>();
		for (const edge of ties(eli, "Odesłania")) {
			const other = known.get(edge.to);
			if (!other || !GONE.has(other.status) || referred.has(edge.to)) continue;
			referred.add(edge.to);
			const next = successor(edge.to);
			finding({
				kind: "reference-repealed",
				to: edge.to,
				status: other.status,
				...(next ? { successor: next } : {}),
				proposal: `It refers to ${edge.to}, which is ${other.status}: ${next ? `refer to ${next}, which repealed it, or to what took its place` : "refer to what took its place"}.`,
			});
		}

		if (CONSOLIDATED.has(act.type)) {
			const last =
				(consolidations.get(eli) ?? [])
					.map((one) => known.get(one)?.date ?? "")
					.sort()
					.at(-1) ?? "";
			const after = ties(eli, "Akty zmieniające").filter(
				(edge) => dateOf(edge) > last,
			);
			if (after.length >= CONSOLIDATE)
				finding({
					kind: "consolidation-due",
					count: after.length,
					...(last ? { since: last } : {}),
					proposal: last
						? `Amended ${after.length} times since its consolidated text of ${last}: a new consolidated text would gather them.`
						: `Amended ${after.length} times and never consolidated: a consolidated text would gather them.`,
				});
		}

		for (const edge of CONSOLIDATED.has(act.type)
			? ties(eli, "Orzeczenie TK")
			: []) {
			const judged = dateOf(edge);
			if (!judged) continue;
			const after = ties(eli, "Akty zmieniające").filter(
				(one) => dateOf(one) > judged,
			);
			if (after.length) continue;
			finding({
				kind: "tribunal",
				to: edge.to,
				since: judged,
				count: 0,
				proposal: `The Constitutional Tribunal's judgment ${edge.to} (${judged}) was not followed by any amendment: check whether it waits for the legislator.`,
			});
		}
	}
	findings.sort(
		(a, b) =>
			a.ELI.localeCompare(b.ELI, "en", { numeric: true }) ||
			a.kind.localeCompare(b.kind) ||
			String(a.to).localeCompare(String(b.to)),
	);
	const kinds: Record<string, number> = {};
	for (const one of findings) kinds[one.kind] = (kinds[one.kind] ?? 0) + 1;
	return {
		findings,
		summary: {
			made: new Date().toISOString(),
			acts: known.size,
			inForce,
			kinds,
		},
	};
}

// every year here read, the findings written
export async function analyseAll() {
	const years = store.listedYears();
	const acts = years.flatMap(({ publisher, year }) =>
		store.readJsonl<GatheringScope.Act>(store.listingPath(publisher, year)),
	);
	const edges = years.flatMap(({ publisher, year }) =>
		store.readJsonl<GatheringScope.Edge>(edgesTablePath(publisher, year)),
	);
	const { findings, summary } = analyse(acts, edges);
	await store.saveJsonl(analysisPath("findings.jsonl"), findings);
	await store.saveJson(analysisPath("summary.json"), summary);
	return summary;
}
