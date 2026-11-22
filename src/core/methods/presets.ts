import { join } from "node:path";
import * as store from "../resources/store.js";
import type { ReadingScope } from "../vars/interfaces/index.js";

// presets of the map of the whole law (map.ts): which acts each draws. Apart from map.ts, so
// readers know them without loading the layout
export const PRESETS: Record<string, ReadingScope.MapPreset> = {
	"statutes-in-force": {
		description: "statutes (ustawy) in force",
		takes: (act) => act.type === "Ustawa" && act.status === "obowiązujący",
	},
	statutes: {
		description: "every statute (ustawa) since 1918",
		takes: (act) => act.type === "Ustawa",
	},
	"in-force": {
		description: "every act in force",
		takes: (act) => act.status === "obowiązujący",
	},
	"statutes-in-force-by-meaning": {
		description: "statutes (ustawy) in force, near what says the same",
		takes: (act) => act.type === "Ustawa" && act.status === "obowiązujący",
		by: "meaning",
	},
};

export const mapPath = (preset: string) =>
	join(store.DATASET_DIR, "map", `${preset}.json`);
