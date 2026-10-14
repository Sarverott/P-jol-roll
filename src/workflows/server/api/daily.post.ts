import { defineEventHandler } from "nitro/h3";
import { start } from "workflow/api";
import type { WorkflowScope } from "../../../core/vars/interfaces/index.js";
import { daily } from "../../flows/daily.js";

// starts one daily run: POST /api/daily {"since": "last", "repositories": ["dataset"], "wait": "3d"}
export default defineEventHandler(async ({ req }) => {
	const asked = (await req
		.json()
		.catch(() => ({}))) as Partial<WorkflowScope.DailyPlan>;
	const plan: WorkflowScope.DailyPlan = {
		since: asked.since ?? "last",
		repositories: asked.repositories ?? ["dataset", "bucket"],
		wait: asked.wait ?? "3d",
		approval: `push:${new Date().toISOString()}`,
	};
	const run = await start(daily, [plan]);
	return {
		runId: run.runId,
		approval: plan.approval,
		answer: `POST /api/daily/approve {"token": "${plan.approval}", "push": true}`,
	};
});
