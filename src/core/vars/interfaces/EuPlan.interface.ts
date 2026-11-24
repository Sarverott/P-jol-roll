export default interface EuPlan {
	years: number[];
	texts: boolean; // the Polish text of every act in force into the bucket
	limit: number; // texts one run may take, 0 means no limit
	rate: number;
}
