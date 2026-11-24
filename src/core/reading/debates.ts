import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import { processPath, SEJM_DATASET, tablePath } from "../apihandlers/sejm.js";
import {
	dayPath,
	dayPdfPath,
	sittingsPath,
	statementPath,
} from "../apihandlers/sittings.js";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";
import * as remote from "./remote.js";

/*
An act in Sejm (phase 35): who said what about it. Its bill is the legislative process that
ended with its ELI (dataset/sejm/term<n>/processes.jsonl); the stages of that process
(bucket/sejm/term<n>/processes/<number>.json) name the sittings and days it was read on; the
statements of those days are in dataset/sejm/term<n>/transcripts/ (task sittings), their texts in
the bucket. A day's statements are about everything on its agenda: a statement whose text is here
and names one of the bill's prints is marked "about" it.
On the demo (remote.ts) the tables and the stages are taken from Hugging Face as they are asked
for; the texts of statements only when they are here.
*/

const TERMS = Array.from({ length: 10 }, (_, index) => index + 1);
const EXCERPT = 600;

const relativeTo = (root: string, path: string) =>
	relative(root, path).split("\\").join("/");

async function here(path: string, bucket = false) {
	if (existsSync(path)) return true;
	if (!remote.remote) return false;
	return bucket
		? remote.fromBucket(relativeTo(store.BUCKET_DIR, path))
		: remote.fromDataset(relativeTo(store.DATASET_DIR, path));
}

function termsHere() {
	if (remote.remote) return TERMS;
	if (!existsSync(SEJM_DATASET)) return [];
	return readdirSync(SEJM_DATASET)
		.map((name) => Number(/^term(\d+)$/.exec(name)?.[1]))
		.filter((term) => term > 0);
}

// the stages of a process that were read on a sitting, the nested ones too
type Stage = {
	stageName?: string;
	date?: string;
	sittingNum?: number;
	decision?: string;
	printNumber?: string;
	children?: Stage[];
};
const flat = (stages: Stage[] = []): Stage[] =>
	stages.flatMap((one) => [one, ...flat(one.children)]);

// a statement's HTML as plain words
const plain = (html: string) =>
	html
		.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();

// where a text names one of the prints: "druk nr 1058", "(druki nr 1111 i 1111-A)"
function mention(text: string, prints: string[]) {
	for (const print of prints) {
		const escaped = print.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
		const found = new RegExp(
			`druk\\w*[^.]{0,40}?(?<![\\w-])${escaped}(?![\\w-])`,
			"i",
		).exec(text);
		if (found) return found.index;
	}
	return -1;
}

export async function debates(eli: string): Promise<ReadingScope.Debate> {
	const debate: ReadingScope.Debate = { ELI: eli, processes: [], days: [] };
	for (const term of termsHere()) {
		if (!(await here(tablePath(term, "processes")))) continue;
		const processes = store
			.readJsonl<GatheringScope.Process>(tablePath(term, "processes"))
			.filter((one) => one.ELI === eli && /^[\w-]+$/.test(one.number));
		for (const process of processes) {
			debate.processes.push({
				term,
				number: process.number,
				title: process.title,
			});
			if (!(await here(processPath(term, process.number), true))) continue;
			const stages = flat(
				store.readJson<{ stages?: Stage[] }>(processPath(term, process.number))
					?.stages,
			);
			const prints = [
				process.number,
				...stages.map((one) => one.printNumber ?? ""),
			].filter((one, index, all) => one && all.indexOf(one) === index);
			await here(sittingsPath(term));
			for (const stage of stages) {
				const sitting = Number(stage.sittingNum);
				const date = String(stage.date ?? "");
				if (!(sitting > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
				if (
					debate.days.some(
						(one) =>
							one.term === term && one.sitting === sitting && one.date === date,
					)
				)
					continue;
				const gathered = await here(dayPath(term, sitting, date));
				const statements = (
					(gathered &&
						store.readJson<GatheringScope.SittingDay>(
							dayPath(term, sitting, date),
						)?.statements) ||
					[]
				).map((one) => {
					const path = statementPath(term, sitting, date, one.num);
					if (!existsSync(path)) return one;
					const words = plain(readFileSync(path, "utf8"));
					const at = mention(words, prints);
					const from = Math.max(0, at - EXCERPT / 3);
					return {
						...one,
						about: at >= 0,
						text: words.slice(
							at >= 0 ? from : 0,
							(at >= 0 ? from : 0) + EXCERPT,
						),
					};
				});
				debate.days.push({
					term,
					sitting,
					date,
					stage: stage.stageName ?? "",
					...(stage.decision ? { decision: stage.decision } : {}),
					gathered,
					...(!gathered && existsSync(dayPdfPath(term, sitting, date))
						? { pdf: true }
						: {}),
					statements,
				});
			}
		}
	}
	debate.days.sort((a, b) => a.date.localeCompare(b.date));
	return debate;
}
