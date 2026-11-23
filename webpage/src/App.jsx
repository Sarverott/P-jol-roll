// The introduction of P_JOL_ROLL, one page. The documentation is the MkDocs site under ./docs/
// (and on Read the Docs); the state comes from state.json, counted at build from TODO.md and
// features.md (scripts/state.mjs), so the page never says more than they do. The lists of the
// page are in data/*.yaml, its parts in components/. The whole page is interface: one slot of
// the translations (src/i18n/dom.ts), code and data under translate="no" left as they are.
//
// NOTE: load it from links.yaml / sources.yaml / ways.yaml (LINKS, SOURCES, WAYS)
// ANSWER: done - data/links.yaml, data/sources.yaml, data/ways.yaml, made into src/lists.json
// before the build (scripts/state.mjs) and imported as plain JSON
// NOTE: split that code into components!
// ANSWER: done - components/: Intro, Languages, Idea, Sources, Ways, Progress, Links, LinkList;
// Background draws the living background of p5.js behind them (phase 22)
import Background from "./components/Background.jsx";
import Idea from "./components/Idea.jsx";
import Intro from "./components/Intro.jsx";
import Links from "./components/Links.jsx";
import Progress from "./components/Progress.jsx";
import Sources from "./components/Sources.jsx";
import Ways from "./components/Ways.jsx";
import state from "./state.json";

export default function App() {
	const { version, phases, features } = state;
	return (
		<>
			<Background />
			<main className="i18n-texts-slot">
				<Intro version={version} />
				<Idea />
				<Sources />
				<Ways />
				<Progress phases={phases} features={features} />
				<Links />
				<footer>
					<p>
						Not (formally) legal advices. A project of the Blacksmith
						Organization System workshop, by Sett Sarverott.
					</p>
				</footer>
			</main>
		</>
	);
}
