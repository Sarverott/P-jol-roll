import type { GatheringScope } from "./index.js";

// one preset of the map of the whole law: which acts are drawn
export default interface MapPreset {
	description: string;
	takes: (act: GatheringScope.Act) => boolean;
	// "meaning": acts tied to their nearest by the vectors of task embed instead of the ties of
	// the source, and only acts that have a vector are drawn
	by?: "ties" | "meaning";
}
