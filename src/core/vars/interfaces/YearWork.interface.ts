// what one year has to give: all its acts, or only these that changed
export default interface YearWork {
	publisher: string;
	year: number;
	changed?: Set<string>; // addresses
}
