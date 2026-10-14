import type { GatheringScope as Types } from "../types/index.js";

// one file to take: where to ask and how its name ends after address of act
export default interface ActFile {
	part: Types.Part;
	url: string;
	suffix: string;
}
