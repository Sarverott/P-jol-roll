import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { type Act, type ActText, filesOf, PARTS } from "./eli.js";
import * as store from "./store.js";

/*
Bucket gives no checksums, so we keep our own: one record per gathered file
in dataset/files/{journal}/{year}.jsonl. Gatherer writes a record when a file
lands on disk. "seal" writes records for files that were gathered before
records existed, "check" reads every file again and names these that differ.
*/

async function sha256Of(path: string) {
	const hash = createHash("sha256");
	await pipeline(createReadStream(path), hash);
	return hash.digest("hex");
}

// every file that an act can have, with the address it comes from
function possible(act: Act) {
	const texts = store.readJson<{ texts?: ActText[] }>(
		store.actPath(act, ".json"),
	)?.texts;
	return PARTS.flatMap((part) => filesOf(act, part, texts));
}

export async function seal() {
	let added = 0;
	for (const { publisher, year } of store.listedYears()) {
		const records = store.sealed(publisher, year);
		for (const act of store.readJsonl<Act>(store.listingPath(publisher, year)))
			for (const { url, suffix } of possible(act)) {
				const path = store.bucketPath(act, suffix);
				const file = store.actPath(act, suffix);
				if (records.has(path) || !existsSync(file)) continue;
				const { size, mtime } = await stat(file);
				await store.appendLine(store.manifestPath(publisher, year), {
					path,
					size,
					sha256: await sha256Of(file),
					url,
					gatheredAt: mtime.toISOString(),
				} satisfies store.FileRecord);
				added += 1;
			}
		console.log(`${publisher}/${year}: ${added} records added so far`);
	}
	return added;
}

// files that are here and are not what was recorded; files that are not here are not named
export async function check() {
	const differs: string[] = [];
	let same = 0;
	for (const { publisher, year } of store.listedYears())
		for (const { path, size, sha256 } of store
			.sealed(publisher, year)
			.values()) {
			const file = `${store.BUCKET_DIR}/${path}`;
			if (!existsSync(file)) continue;
			const here = (await stat(file)).size === size && (await sha256Of(file));
			if (here === sha256) same += 1;
			else differs.push(path);
		}
	return { same, differs };
}
