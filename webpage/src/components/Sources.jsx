import lists from "../lists.json";

const { sources } = lists;

// what is gathered, from where, and where it is kept (data/sources.yaml)
export default function Sources() {
	return (
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
					{sources.map(({ name, since, source, what, where }) => (
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
				Raw files are kept exactly as the sources gave them, each recorded with
				its checksum when it arrived; texts become markdown; acts are tied to
				what they change and what carries them out.
			</p>
		</section>
	);
}
