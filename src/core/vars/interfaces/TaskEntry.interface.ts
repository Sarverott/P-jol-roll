// one task of the Taskfiles, as `task --list-all --json` names it and the launcher shows it
export default interface TaskEntry {
	name: string; // what `task <name>` runs, e.g. gather:changes, docs:build
	desc: string;
	group: string; // the Taskfile it comes from: project (the root one), docs, flow, ...
	taskfile: string; // that Taskfile, relative to the root of the repository
}
