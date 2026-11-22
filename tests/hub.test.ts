import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
	compare,
	hashOf,
	heldBack,
	localFiles,
	rateLimitWait,
	repoOf,
	target,
} from "../src/core/resources/hub.js";

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

test("a refused commit is waited out for the time huggingface names", () => {
	const refused = Object.assign(
		new Error(
			"You have exceeded the rate limit for repository commit creation (128 per hour). You can retry this action in about 1 hour.",
		),
		{ statusCode: 429 },
	);
	expect(rateLimitWait(refused)).toBe(3_660_000);
	expect(rateLimitWait(new Error("rate limit, retry in about 5 minutes"))).toBe(
		360_000,
	);
	expect(rateLimitWait({ statusCode: 429 })).toBe(3_600_000);
	expect(rateLimitWait(new Error("401 unauthorized"))).toBeUndefined();
});

test("a missing or wrong name says which names there are", () => {
	expect(() => target("")).toThrow(
		"name a repository after the action - one of: dataset, bucket, space",
	);
	expect(() => target("datset")).toThrow(
		"datset is not in .map.json - one of: dataset, bucket, space",
	);
	expect(target("space").repo).toBe(
		"spaces/Sarverott/docs-of-law-by-gov-in-poland",
	);
});

test("texts with control characters are held back from a push, other files are not", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pjolroll-held-"));
	await writeFile(join(dir, "clean.md"), "Art. 1. Tekst\n");
	await writeFile(join(dir, "glyphs.md"), "Art. 1.\u0003\n\u0003\n");
	await writeFile(join(dir, "act.pdf"), "%PDF\u0003\u0000");
	expect(heldBack(dir, ["clean.md", "glyphs.md", "act.pdf"])).toEqual([
		"glyphs.md",
	]);
});
