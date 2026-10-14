import { defineEventHandler, HTTPError } from "nitro/h3";
import { resumeHook } from "workflow/api";
import type { WorkflowScope } from "../../../../core/vars/interfaces/index.js";

// answer of a person to a run that waits: POST /api/daily/approve {"token": "push:...", "push": true}
// the server listens on this machine only, which is what makes the answer a person's
export default defineEventHandler(async ({ req }) => {
	const { token, push, by } = (await req.json()) as WorkflowScope.Approval & {
		token: string;
	};
	try {
		const resumed = await resumeHook<WorkflowScope.Approval>(token, {
			push: push === true,
			by: by ?? "local",
		});
		return { runId: resumed.runId, push: push === true };
	} catch {
		throw new HTTPError({ status: 404, message: `no run waits for ${token}` });
	}
});
