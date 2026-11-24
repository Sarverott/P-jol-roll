import type { z } from "zod";
import { debates } from "../../../core/reading/debates.js";
import { answer } from "../shared.js";
import type metadata from "./metadata.js";

export default async ({ eli, all }: z.infer<typeof metadata.inputSchema>) => {
	const debate = await debates(eli);
	if (all) return answer(debate);
	// a day of a sitting holds hundreds of statements about everything on its agenda: those
	// about the bill when their texts are here, else who spoke, without more
	return answer({
		...debate,
		days: debate.days.map((day) => {
			const read = day.statements.some((one) => one.about !== undefined);
			return {
				...day,
				statements: read
					? day.statements.filter((one) => one.about)
					: day.statements.map(({ num, name, function: as, club }) => ({
							num,
							name,
							function: as,
							club,
						})),
			};
		}),
	});
};
