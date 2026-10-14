export default interface SaosPlan {
	years: number[];
	limit: number; // how many months one run may take, 0 means no limit
	rate: number;
	today?: Date;
}
