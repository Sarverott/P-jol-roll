// where it stands: the marks of features.md and the phases of TODO.md (state.json)
function word(phase) {
	if (phase.all && phase.done === phase.all) return "complete";
	return phase.done ? "in progress" : "not started";
}

export default function Progress({ phases, features }) {
	return (
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
	);
}
