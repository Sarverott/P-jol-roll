import type { WorkflowScope as WorkflowTypes } from "../types/index.js";

// what one daily run is asked to do - arguments of the workflow, kept in its event log
export default interface DailyPlan {
	since: string; // "last" or a day, as gather --since takes it
	repositories: string[]; // names of resources/.map.json to plan and, once approved, to push
	approval: string; // token that the approval answers to: "push:<time of start>"
	wait: WorkflowTypes.Duration; // how long the run waits for an answer before it ends without pushing, "3d"
}
