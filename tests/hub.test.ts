import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { compare, hashOf, localFiles, repoOf } from "../src/hub.js";

test("repository is named by path of its address", () => {
	expect(repoOf("https://huggingface.co/datasets/Sarverott/x")).toBe(
		"datasets/Sarverott/x",
	);
	expect(repoOf("https://huggingface.co/buckets/Sarverott/y")).toBe(
		"buckets/Sarverott/y",
	);
});

test("only what differs is moved", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pjolroll-hub-"));
	await writeFile(join(dir, "same.txt"), "hello\n");
	await writeFile(join(dir, "edited.txt"), "hullo\n");
	await writeFile(join(dir, "longer.txt"), "hello hello\n");
	await writeFile(join(dir, "new.txt"), "hello\n");
	await writeFile(join(dir, "unfinished.pdf.part"), "%PDF");

	// hash that git gives to "hello\n"
	const oid = "ce013625030ba8dba906f756967f9e9ca394464a";
	expect(await hashOf(join(dir, "same.txt"), "git")).toBe(oid);

	const remote = new Map([
		["same.txt", { size: 6, oid }],
		["edited.txt", { size: 6, oid }],
		["longer.txt", { size: 6, oid }],
		["only-there.txt", { size: 6, oid }],
	]);
	const difference = await compare(dir, await localFiles(dir), remote);
	expect(difference).toEqual({
		upload: ["new.txt"],
		changed: ["edited.txt", "longer.txt"],
		download: ["only-there.txt"],
		same: 1,
	});
});
