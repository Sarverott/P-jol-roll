import { createHook, sleep } from "workflow";
import type { WorkflowScope } from "../../core/vars/interfaces/index.js";
import * as steps from "./steps.js";

/*
One daily run: what changed at the source comes in, gets its checksums, tables
and markdown, then the run shows what would be sent to huggingface and waits
for a person. Sending is never decided here - only a "yes" sent to the
approval token makes the run push; no answer in time ends it without pushing.
*/
export async function daily(plan: WorkflowScope.DailyPlan) {
	"use workflow";

	const done: WorkflowScope.CommandResult[] = [];
	done.push(await steps.gatherChanges(plan.since));
	done.push(await steps.seal());
	done.push(await steps.compile());
	done.push(await steps.text());

	const plans: WorkflowScope.CommandResult[] = [];
	for (const repository of plan.repositories)
		plans.push(await steps.plan(repository));

	using approval = createHook<WorkflowScope.Approval>({ token: plan.approval });
	const answer = await Promise.race([
		approval,
		sleep(plan.wait).then(
			(): WorkflowScope.Approval => ({ push: false, by: "nobody in time" }),
		),
	]);

	const pushed: WorkflowScope.CommandResult[] = [];
	if (answer.push)
		for (const repository of plan.repositories)
			pushed.push(await steps.push(repository));

	return { done, plans, answer, pushed };
}
