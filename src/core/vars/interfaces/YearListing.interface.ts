import type Act from "./Act.interface.js";

export default interface YearListing {
	count: number;
	totalCount: number;
	items: Act[];
}
