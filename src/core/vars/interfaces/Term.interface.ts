export default interface Term {
	num: number;
	current: boolean;
	from: string;
	to?: string;
	prints?: { count: number };
}
