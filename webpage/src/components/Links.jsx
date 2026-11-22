import lists from "../lists.json";
import LinkList from "./LinkList.jsx";

const { links } = lists;

// where the project is (data/links.yaml)
export default function Links() {
	return (
		<section>
			<h2>Links</h2>
			<LinkList items={links} />
		</section>
	);
}
