import { useState } from "react";
import { chosen, languages, use } from "../../../src/i18n/browser.ts";

// the language of the page: a pack laid over it, the page itself stays as written
export default function Languages() {
	const [code, setCode] = useState(chosen());
	if (languages.length < 2) return null;
	return (
		<select
			className="language"
			aria-label="language"
			translate="no"
			value={code}
			onChange={(event) => {
				setCode(event.target.value);
				use(event.target.value);
			}}
		>
			{languages.map((one) => (
				<option key={one.code} value={one.code}>
					{one.name}
				</option>
			))}
		</select>
	);
}
