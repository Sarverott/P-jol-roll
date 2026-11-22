import type { CatalogScope as CatalogTypes } from "../types/index.js";
import type { CatalogScope } from "./index.js";

// one function of the project, declared once in src/core/catalog/procedures.ts and offered by
// every way the project runs (docs/guides/functions.md is the map written from them)
export default interface Procedure {
	name: string; // a command of the REPL and of "task do": "acts", "gather"
	group: CatalogTypes.Group;
	title: string; // what it does, one line
	params: CatalogScope.Parameter[];
	// it changes resources/, the repository or a remote (the source, Hugging Face) - offered
	// by terminals, and by a host on this machine with --allow-writing (Q19); a public host
	// shows it disabled
	writes: boolean;
	task?: string; // the task that runs it
	// the answer here, through src/core/reading/ - for reading functions
	read?: (values: CatalogTypes.Values) => unknown;
	// where each other way offers it: the viewer's address, the api's route, the MCP tool...
	ways: Partial<Record<CatalogTypes.Way, string>>;
}
