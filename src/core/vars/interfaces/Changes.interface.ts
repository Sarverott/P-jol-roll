import type YearListing from "./YearListing.interface.js";

// answer of GET /changes/acts - a page of acts with their details
export default interface Changes extends YearListing {
	offset: number;
}
