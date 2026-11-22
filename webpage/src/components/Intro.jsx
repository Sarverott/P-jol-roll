import Languages from "./Languages.jsx";

// the name, the version and one sentence of what it is
export default function Intro({ version }) {
	return (
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
	);
}
