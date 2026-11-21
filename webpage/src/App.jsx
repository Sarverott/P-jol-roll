// The introduction of P_JOL_ROLL, one page. The documentation is the MkDocs site under ./docs/
// (and on Read the Docs); the state comes from state.json, counted at build from TODO.md and
// features.md (scripts/state.mjs), so the page never says more than they do.
import state from "./state.json";

const HF = "https://huggingface.co";
const LINKS = [
	["Documentation", "./docs/", "guides, glossary, the plan - on this website"],
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

function word(phase) {
	if (phase.all && phase.done === phase.all) return "complete";
	return phase.done ? "in progress" : "not started";
}

export default function App() {
	const { version, phases, features } = state;
	return (
		<main>
			<header>
				<p className="version">v{version}</p>
				<h1>P_JOL_ROLL</h1>
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
