import type { GatheringScope } from "./index.js";

// one page of acts of a year, as readers ask for it
export default interface ActPage {
	total: number; // acts that match, on all pages
	offset: number;
	items: GatheringScope.Act[];
}
