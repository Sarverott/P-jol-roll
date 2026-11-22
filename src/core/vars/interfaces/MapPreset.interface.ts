import type { GatheringScope } from "./index.js";

// one preset of the map of the whole law: which acts are drawn
export default interface MapPreset {
	description: string;
	takes: (act: GatheringScope.Act) => boolean;
}
