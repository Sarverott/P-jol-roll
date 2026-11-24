// a sitting of Sejm (phase 35): /sejm/term{n}/proceedings - its number and the days it sat
export default interface Sitting {
	number: number;
	title: string;
	dates: string[]; // YYYY-MM-DD
	current?: boolean;
	[field: string]: unknown;
}
