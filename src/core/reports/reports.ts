import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { connect } from "node:tls";
import nodemailer from "nodemailer";
import { parse, stringify } from "yaml";
import { ROOT } from "../paths/at.js";
import * as store from "../resources/store.js";

/*
Reports to the authorities (phase 45, the owner's order of phase 41; what and to whom is Q20):
drafted from what the project can check, read by a person, and only then sent - by mail, from the
owner's own mailbox. Nothing here sends by itself, and an agent never sends.
  draft   the problems found, each a draft with its evidence, checked again now:
          resources/reports/drafts/<date>-<kind>-<host>.md (YAML front matter, then the letter)
            certificate  a public server whose chain of certificates does not verify (the
                         voivodeships' journals of phase 43, dataset/regional/journals.json)
  send    one draft shown whole, a person asked yes or no at a terminal, then sent through
          REPORT_SMTP (an smtp:// or smtps:// address of the owner's mailbox) from REPORT_FROM,
          and moved to resources/reports/sent/ with its Message-ID
The authorities: resources/configs/reports/authorities.yaml - official contacts read from their
own pages; a draft goes to the one whose `for` names its kind.
*/

export type Authority = {
	id: string;
	name: string;
	email: string;
	form?: string;
	page: string;
	verified: string;
	for: string[];
};
export type Draft = {
	to: string;
	kind: string;
	host: string;
	observed: string;
	subject: string;
	evidence: Record<string, unknown>;
};

export const reportsDir = () => join(store.RESOURCES_DIR, "reports");
const HOST = /^[a-z0-9.-]+$/;

export function authorities(): Authority[] {
	const file =
		process.env.REPORT_AUTHORITIES ??
		join(ROOT, "resources", "configs", "reports", "authorities.yaml");
	return (parse(readFileSync(file, "utf8")) as { authorities: Authority[] })
		.authorities;
}

// a server's chain of certificates: whether it verifies, as any client of the journal's API meets
// it (verification on - never turned off here), and what the server presents, as openssl shows it
// (the same command the letter gives the reader to check it)
export async function certificateOf(host: string, port = 443) {
	const verdict = await new Promise<{ verified: boolean; error: string }>(
		(done) => {
			const socket = connect(
				{ host, port, servername: host, timeout: 20_000 },
				() => {
					done({ verified: true, error: "" });
					socket.end();
				},
			);
			socket.on("timeout", () => {
				socket.destroy();
				done({ verified: false, error: "no answer in 20 s" });
			});
			socket.on("error", (error: NodeJS.ErrnoException) =>
				done({ verified: false, error: error.code ?? error.message }),
			);
		},
	);
	return { ...verdict, ...presented(host, port) };
}

// what the server presents, by openssl s_client: subject, issuer, dates, its verify result
function presented(host: string, port: number): Record<string, string> {
	const shown = spawnSync(
		"openssl",
		["s_client", "-connect", `${host}:${port}`, "-servername", host],
		{ input: "", encoding: "utf8", timeout: 30_000 },
	);
	if (shown.error || !shown.stdout) return {};
	const pem =
		/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/.exec(
			shown.stdout,
		)?.[0];
	const details = pem
		? spawnSync(
				"openssl",
				["x509", "-noout", "-subject", "-issuer", "-startdate", "-enddate"],
				{
					input: pem,
					encoding: "utf8",
				},
			).stdout
		: "";
	const field = (name: string) =>
		new RegExp(`^${name}=\\s*(.+)$`, "m").exec(details)?.[1]?.trim() ?? "";
	return {
		subject: field("subject"),
		issuer: field("issuer"),
		validFrom: field("notBefore"),
		validTo: field("notAfter"),
		openssl: /Verify return code: .+/.exec(shown.stdout)?.[0] ?? "",
	};
}

const letter = (draft: Draft) => `Dzień dobry,

zgłaszam problem bezpieczeństwa publicznego serwisu ${draft.host}, zauważony
${draft.observed.slice(0, 10)} przez otwarty projekt P_JOL_ROLL, który zbiera akty prawne
z dzienników urzędowych (https://github.com/Sarverott/P-jol-roll).

Łańcuch certyfikatów TLS serwera https://${draft.host}/ nie daje się zweryfikować:
klient, który nie dociąga brakujących certyfikatów pośrednich sam (jak przeglądarki), odrzuca
połączenie. Dotyczy to programów korzystających z publicznego API dziennika urzędowego.

Dowody (sprawdzone ${draft.observed}):
${Object.entries(draft.evidence)
	.map(([name, value]) => `- ${name}: ${value}`)
	.join("\n")}

Sprawdzenie: openssl s_client -connect ${draft.host}:443 -servername ${draft.host} -showcerts

Z poważaniem,
P_JOL_ROLL - https://github.com/Sarverott/P-jol-roll
`;

export async function draft({
	check = certificateOf,
	now = new Date(),
}: {
	check?: typeof certificateOf;
	now?: Date;
} = {}) {
	const journals =
		store.readJson<{ host: string; voivodeship: string; error?: string }[]>(
			join(store.DATASET_DIR, "regional", "journals.json"),
		) ?? [];
	const to = authorities().find((one) => one.for.includes("certificate"));
	const made: string[] = [];
	const folder = join(reportsDir(), "drafts");
	for (const journal of journals) {
		if (
			!/CERT|SIGNATURE|ISSUER/.test(journal.error ?? "") ||
			!HOST.test(journal.host)
		)
			continue;
		const evidence = await check(journal.host);
		if (evidence.verified) continue; // repaired since: nothing to report
		const draft: Draft = {
			to: to?.id ?? "",
			kind: "certificate",
			host: journal.host,
			observed: now.toISOString(),
			subject: `Niezweryfikowany łańcuch certyfikatów TLS: ${journal.host} (dziennik urzędowy, ${journal.voivodeship})`,
			evidence,
		};
		mkdirSync(folder, { recursive: true });
		const path = join(
			folder,
			`${now.toISOString().slice(0, 10)}-certificate-${journal.host}.md`,
		);
		writeFileSync(path, `---\n${stringify(draft)}---\n\n${letter(draft)}`);
		made.push(path);
	}
	return made;
}

export function drafts() {
	const folder = join(reportsDir(), "drafts");
	try {
		return readdirSync(folder).filter((name) => name.endsWith(".md"));
	} catch {
		return [];
	}
}

export function readDraft(path: string) {
	const text = readFileSync(path, "utf8");
	const found = /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/.exec(text);
	if (!found) throw new Error(`${path}: not a draft (no front matter)`);
	return { draft: parse(found[1]) as Draft, body: found[2] };
}

// one draft sent after a person's yes; never without it
export async function send(
	path: string,
	confirm: (shown: string) => Promise<boolean>,
	transport = process.env.REPORT_SMTP
		? nodemailer.createTransport(process.env.REPORT_SMTP)
		: undefined,
) {
	const { draft, body } = readDraft(path);
	const to = authorities().find((one) => one.id === draft.to);
	if (!to?.email)
		throw new Error(
			`${draft.to || "nobody"}: no confirmed e-mail of this authority (Q20)`,
		);
	const from = process.env.REPORT_FROM;
	if (!transport || !from)
		throw new Error(
			"no mailbox: REPORT_SMTP and REPORT_FROM in .env, the owner's own",
		);
	const shown = `From: ${from}\nTo: ${to.name} <${to.email}>\nSubject: ${draft.subject}\n\n${body}`;
	if (!(await confirm(shown))) return { sent: false };
	const info = await transport.sendMail({
		from,
		to: to.email,
		subject: draft.subject,
		text: body,
	});
	const sent = join(reportsDir(), "sent");
	mkdirSync(sent, { recursive: true });
	const target = join(sent, path.split(/[/\\]/).at(-1) as string);
	renameSync(path, target);
	writeFileSync(
		`${target}.sent.json`,
		`${JSON.stringify({ to: to.email, messageId: info.messageId, sentAt: new Date().toISOString() }, null, "\t")}\n`,
	);
	return { sent: true, messageId: info.messageId, path: target };
}
