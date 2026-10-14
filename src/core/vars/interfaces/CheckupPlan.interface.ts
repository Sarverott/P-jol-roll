export default interface CheckupPlan {
	publishers: string[]; // journals to walk, listings of them have to be gathered first
	years: number[];
	frontends: string[]; // names from resources/frontends.json, empty means every one
	limit: number; // how many pages one run may open, 0 means no limit
	headless: boolean;
}
