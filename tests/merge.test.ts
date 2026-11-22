import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { merge } from "../src/devtools/merge.js";

test("a source moves into the one dataset, never over a file that is there", () => {
	const dir = mkdtempSync(join(tmpdir(), "p-jol-roll-merge-"));
	const from = join(dir, "sejm-dataset");
	const to = join(dir, "dataset", "sejm");
	mkdirSync(join(from, "term10"), { recursive: true });
	mkdirSync(to, { recursive: true });
	writeFileSync(join(from, "terms.json"), "old");
	writeFileSync(join(from, "term10", "prints.jsonl"), "prints");
	writeFileSync(join(to, "terms.json"), "kept");

	const { moved, left } = merge(from, to);

	expect(moved).toBe(1);
	expect(left).toEqual([join(from, "terms.json")]);
	expect(readFileSync(join(to, "term10", "prints.jsonl"), "utf8")).toBe(
		"prints",
	);
	expect(readFileSync(join(to, "terms.json"), "utf8")).toBe("kept");
	expect(existsSync(join(from, "term10"))).toBe(false);
});
