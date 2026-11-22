// a list of links, each with what it holds: the ways in, the links at the end
export default function LinkList({ items, className = "links" }) {
	return (
		<ul className={className}>
			{items.map(({ name, href, what }) => (
				<li key={name}>
					<a href={href}>{name}</a> <span>{what}</span>
				</li>
			))}
		</ul>
	);
}
