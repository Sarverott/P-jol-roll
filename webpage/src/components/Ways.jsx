import ways from "../data/ways.yaml";
import LinkList from "./LinkList.jsx";

// the ways in, from the lightest (data/ways.yaml), and how to start it at home
export default function Ways() {
	return (
		<section>
			<h2>Ways in</h2>
			<LinkList items={ways} className="links ways" />
			<pre>
				<code>{`git clone https://github.com/Sarverott/P-jol-roll.git
cd P-jol-roll && npm install
npx task init     # once: tools checked, .env, secrets
npx task          # a menu of every way to run it`}</code>
			</pre>
		</section>
	);
}
