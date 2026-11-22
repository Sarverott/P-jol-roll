// The introduction of P_JOL_ROLL, one page. The documentation is the MkDocs site under ./docs/
// (and on Read the Docs); the state comes from state.json, counted at build from TODO.md and
// features.md (scripts/state.mjs), so the page never says more than they do.
import { useState } from "react";
import { chosen, languages, use } from "../../src/i18n/browser.ts";
import state from "./state.json";

const HF = "https://huggingface.co";
const LINKS = [
	["Documentation", "./docs/", "guides, glossary, the plan - on this website"],
	[
		"Examples",
		"./examples/",
		"using it from Python, run when this page was built",
	],
	[
		"Read the Docs",
		"https://lex-polonica.readthedocs.io/",
		"the same documentation, by version",
	],
	[
		"Demo",
		`${HF}/spaces/Sarverott/docs-of-law-by-gov-in-poland`,
		"browse the acts",
	],
	[
		"Dataset",
		`${HF}/datasets/Sarverott/polish_national_law_docs`,
		"tables and markdown of the acts",
	],
	[
		"Bucket",
		`${HF}/buckets/Sarverott/raw-law-of-poland`,
		"raw files of every act",
	],
	[
		"Podcasts",
		"https://drive.google.com/drive/folders/1yklwKu-k9AXvT_CJlFhjhtmbaY3VSD7k",
		"about the project, in 12 languages",
	],
	["Code", "https://github.com/Sarverott/P-jol-roll", "AGPL-3.0-only"],
];

// what is gathered, from where, and where it is kept
const SOURCES = [
	[
		"Dziennik Ustaw",
		"since 1918",
		"ELI API of Sejm",
		"acts: details, PDF, HTML, references",
		"bucket/DU/, dataset/acts/DU/",
	],
	[
		"Monitor Polski",
		"since 1930",
		"ELI API of Sejm",
		"the same",
		"bucket/MP/, dataset/acts/MP/",
	],
	[
		"Work of Sejm",
		"terms 6-10",
		"API of Sejm",
		"legislative processes, prints with justifications",
		"bucket/sejm/, dataset/sejm/",
	],
	[
		"Court judgments",
		"by month",
		"SAOS",
		"judgments with their texts",
		"dataset/SAOS/",
	],
];

// the ways in, from the lightest
const WAYS = [
	[
		"Browse",
		`${HF}/spaces/Sarverott/docs-of-law-by-gov-in-poland`,
		"the demo: the project's own server reading the dataset online, nothing to install",
	],
	[
		"Read the data",
		`${HF}/datasets/Sarverott/polish_national_law_docs`,
		"tables of every source in one dataset (the training collection), raw files in one bucket",
	],
	[
		"Use it from Python",
		"./examples/",
		"notebooks: the acts of a year, one act checked against its checksum, the api",
	],
	[
		"Run it at home",
		"./docs/guides/installation/",
		"the api with the website, an MCP server for AI agents, a desktop window, a browser extension, containers",
	],
	[
		"Gather it yourself",
		"./docs/guides/gathering/",
		"politely, from the open sources - the same tools that filled the dataset",
	],
];

function word(phase) {
	if (phase.all && phase.done === phase.all) return "complete";
	return phase.done ? "in progress" : "not started";
}

// the language of the page: a pack laid over it, the page itself stays as written
function Languages() {
	const [code, setCode] = useState(chosen());
	if (languages.length < 2) return null;
	return (
		<select
			className="language"
			aria-label="language"
			translate="no"
			value={code}
			onChange={(event) => {
				setCode(event.target.value);
				use(event.target.value);
			}}
		>
			{languages.map((one) => (
				<option key={one.code} value={one.code}>
					{one.name}
				</option>
			))}
		</select>
	);
}

export default function App() {
	const { version, phases, features } = state;
	return (
		<main>
			<header>
				<Languages />
				<p className="version" translate="no">
					v{version}
				</p>
				<h1 translate="no">P_JOL_ROLL</h1>
				<p className="lead">
					Every act of the Polish journals of laws - Dziennik Ustaw since 1918,
					Monitor Polski since 1930 - gathered in the open.
				</p>
			</header>

			<section>
				<h2>The idea</h2>
				<p>
					It takes every act from the open ELI API of Sejm, keeps the raw files
					and tables of them, checks every file by its checksum, turns the texts
					into markdown, ties acts to each other, and shows it all through an
					api, a website and an MCP server for AI agents.
				</p>
				<p>
					The far goal: a small model and an agent that read this law and give{" "}
					<strong>a devil's advocate to every person</strong> in the country, as
					open source.
				</p>
				<img
					style={{ width: "100%" }}
					alt="P_JOL_ROLL"
					src="https://gist.githubusercontent.com/Sarverott/025bda4b967642107b88345c0e465b1a/raw/6cf448f5ef52a55ba8efb94e6d95e65f4df4954d/p-jol-roll_edited-color.png"
				/>
			</section>

			<section>
				<h2>What is gathered</h2>
				<table className="sources">
					<thead>
						<tr>
							<th>What</th>
							<th>From</th>
							<th>Kept in</th>
						</tr>
					</thead>
					<tbody>
						{SOURCES.map(([name, since, source, what, where]) => (
							<tr key={name}>
								<td>
									<strong>{name}</strong> <span>{since}</span>
									<br />
									<span>{what}</span>
								</td>
								<td>{source}</td>
								<td>
									<code>{where}</code>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<p>
					Raw files are kept exactly as the sources gave them, each recorded
					with its checksum when it arrived; texts become markdown; acts are
					tied to what they change and what carries them out.
				</p>
			</section>

			<section>
				<h2>Ways in</h2>
				<ul className="links ways">
					{WAYS.map(([name, href, what]) => (
						<li key={name}>
							<a href={href}>{name}</a> <span>{what}</span>
						</li>
					))}
				</ul>
				<pre>
					<code>{`git clone https://github.com/Sarverott/P-jol-roll.git
cd P-jol-roll && npm install
npx task init     # once: tools checked, .env, secrets
npx task          # a menu of every way to run it`}</code>
				</pre>
			</section>

			<section>
				<h2>Where it stands</h2>
				<p>
					Functions: <strong>{features.works} work</strong>, {features.built}{" "}
					built and not yet proven on real data, {features.wanted} wanted.
				</p>
				<ol className="phases">
					{phases.map((phase) => (
						<li key={phase.n} className={word(phase).replace(" ", "-")}>
							<span className="name">
								{phase.n}. {phase.title}
							</span>
							<span className="count">
								{phase.done}/{phase.all} · {word(phase)}
							</span>
						</li>
					))}
				</ol>
			</section>

			<section>
				<h2>Links</h2>
				<ul className="links">
					{LINKS.map(([name, href, what]) => (
						<li key={name}>
							<a href={href}>{name}</a> <span>{what}</span>
						</li>
					))}
				</ul>
			</section>

			<footer>
				<p>
					Nothing here is legal advice. A project of the Blacksmith Organization
					System workshop, by Sett Sarverott.
				</p>
			</footer>
		</main>
	);
}
