import type { AlmanacScope } from "../core/vars/interfaces/index.js";

/*
Rulesets of the almanac, as BOS has them: rules written as data, judged by code. The first rule
that applies to a case decides; nothing applies - allowed.
  judge(rules, { action: "push", target: "dataset", actor: "agent" }) -> violation
*/

type Rule = AlmanacScope.Rule;
export type Case = {
	action: string;
	target?: string;
	actor?: string;
	flags?: string[];
};

// a glob matched whole, ignoring case; * stands for any run of letters
export function globMatches(glob: string, value: string) {
	const pattern = glob
		.split("*")
		.map((part) => part.replace(/[.+?^${}()|[\]\\/]/g, "\\$&"))
		.join(".*");
	return new RegExp(`^${pattern}$`, "i").test(value);
}

const listed = (wanted: string | string[] | undefined, value?: string) =>
	wanted === undefined ||
	(value !== undefined &&
		(Array.isArray(wanted) ? wanted : [wanted]).some((glob) =>
			globMatches(glob, value),
		));

export function applies(rule: Rule, said: Case) {
	const { action, target, actor, flags } = rule.when;
	return (
		listed(action, said.action) &&
		listed(target, said.target) &&
		listed(actor, said.actor) &&
		(!flags || flags.some((flag) => said.flags?.includes(flag)))
	);
}

export function judge(rules: Rule[], said: Case) {
	const rule = rules.find((one) => applies(one, said));
	return rule
		? { verdict: rule.verdict, rule }
		: { verdict: "allowed" as const, rule: undefined };
}
