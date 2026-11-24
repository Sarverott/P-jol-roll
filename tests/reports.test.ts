import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { expect, test } from "vitest";

// reports to the authorities (phase 45): drafted from what was found, sent only after a yes -
// through a transport that only says what it would send
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-reports-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
const registry = join(work, "authorities.yaml");
await writeFile(
	registry,
	`authorities:
  - {id: cert-polska, name: CERT Polska, email: "cert@example.org", page: "https://cert.example/", verified: "2026-11-24", for: [certificate]}
  - {id: silent, name: An authority with no address, email: "", page: "https://x.example/", verified: "", for: []}
`,
);
process.env.REPORT_AUTHORITIES = registry;
process.env.REPORT_FROM = "owner@example.org";
await mkdir(join(resources, "dataset", "regional"), { recursive: true });
await writeFile(
	join(resources, "dataset", "regional", "journals.json"),
	JSON.stringify([
		{
			voivodeship: "lubuskie",
			host: "dzienniki.luw.pl",
			answers: false,
			error: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
		},
		{
			voivodeship: "łódzkie",
			host: "dziennik.lodzkie.eu",
			answers: false,
			error: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
		},
		{
			voivodeship: "mazowieckie",
			host: "edziennik.mazowieckie.pl",
			answers: false,
			error: "timeout",
		},
		{
			voivodeship: "lubelskie",
			host: "edziennik.lublin.uw.gov.pl",
			answers: true,
		},
	]),
);

test("a certificate that does not verify drafted, checked again; sent only after a yes", async () => {
	const { draft, readDraft, send } = await import(
		"../src/core/reports/reports.js"
	);
	const checked: string[] = [];
	const made = await draft({
		now: new Date("2026-11-24T18:00:00Z"),
		check: async (host) => {
			checked.push(host);
			// łódzkie repaired its chain since: nothing to report
			return host === "dziennik.lodzkie.eu"
				? { verified: true }
				: {
						verified: false,
						error: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
						issuer: "home.pl S.A.",
					};
		},
	});
	// a timeout is no security problem; only the certificates were checked again
	expect(checked).toEqual(["dzienniki.luw.pl", "dziennik.lodzkie.eu"]);
	expect(made).toHaveLength(1);
	const { draft: front, body } = readDraft(made[0]);
	expect(front).toMatchObject({
		to: "cert-polska",
		kind: "certificate",
		host: "dzienniki.luw.pl",
		evidence: {
			error: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
			issuer: "home.pl S.A.",
		},
	});
	expect(body).toContain("openssl s_client -connect dzienniki.luw.pl:443");

	const transport = nodemailer.createTransport({ jsonTransport: true });
	let shown = "";
	// no: nothing sent, the draft stays
	expect(
		await send(
			made[0],
			async (text) => {
				shown = text;
				return false;
			},
			transport,
		),
	).toEqual({ sent: false });
	expect(shown).toContain("To: CERT Polska <cert@example.org>");
	expect(existsSync(made[0])).toBe(true);
	// yes: sent, moved to sent/ with its Message-ID
	const done = await send(made[0], async () => true, transport);
	expect(done.sent).toBe(true);
	expect(existsSync(made[0])).toBe(false);
	expect(
		JSON.parse(readFileSync(`${done.path}.sent.json`, "utf8")),
	).toMatchObject({
		to: "cert@example.org",
	});
});

test("no confirmed address, no mailbox: nothing is sent", async () => {
	const { send } = await import("../src/core/reports/reports.js");
	const path = join(resources, "reports", "drafts", "x.md");
	await mkdir(join(resources, "reports", "drafts"), { recursive: true });
	await writeFile(path, "---\nto: silent\nsubject: s\n---\n\nbody\n");
	await expect(
		send(
			path,
			async () => true,
			nodemailer.createTransport({ jsonTransport: true }),
		),
	).rejects.toThrow(/no confirmed e-mail/);
	await writeFile(path, "---\nto: cert-polska\nsubject: s\n---\n\nbody\n");
	await expect(send(path, async () => true, undefined)).rejects.toThrow(
		/no mailbox/,
	);
});
