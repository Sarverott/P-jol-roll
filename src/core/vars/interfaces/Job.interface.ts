// a writing function of the catalog started by a host on this machine (Q19: the api with
// --allow-writing, the desktop app): its task running, followed by the viewer
export default interface Job {
	id: number;
	name: string; // the function of the catalog: "stats"
	task: string; // the task it runs: "stats"
	args: string[]; // the words after "--"
	state: "running" | "done" | "failed";
	started: string; // ISO time
	ended?: string;
	code?: number | null; // the exit code of the task
	lines: string[]; // the newest lines of its output, at most LINES
}
