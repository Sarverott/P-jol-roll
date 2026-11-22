// what it does and what for, with the banner of the project (resources/mediafiles)
const BANNER =
	"https://gist.githubusercontent.com/Sarverott/025bda4b967642107b88345c0e465b1a/raw/6cf448f5ef52a55ba8efb94e6d95e65f4df4954d/p-jol-roll_edited-color.png";

export default function Idea() {
	return (
		<section>
			<h2>The idea</h2>
			<p>
				It takes every act from the open ELI API of Sejm, keeps the raw files
				and tables of them, checks every file by its checksum, turns the texts
				into markdown, ties acts to each other, and shows it all through an api,
				a website and an MCP server for AI agents.
			</p>
			<p>
				The far goal: a small model and an agent that read this law and give{" "}
				<strong>a devil's advocate to every person</strong> in the country, as
				open source.
			</p>
			<img style={{ width: "100%" }} alt="P_JOL_ROLL" src={BANNER} />
		</section>
	);
}
