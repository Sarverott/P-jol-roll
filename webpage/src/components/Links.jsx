import links from "../data/links.yaml";
import LinkList from "./LinkList.jsx";

// where the project is (data/links.yaml)
export default function Links() {
	return (
		<section>
			<h2>Links</h2>
			<LinkList items={links} />
		</section>
	);
}
