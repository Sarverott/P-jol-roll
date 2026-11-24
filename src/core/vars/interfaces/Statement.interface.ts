// one statement of a sitting day (phase 35): /sejm/term{n}/proceedings/{sitting}/{date}/transcripts
export default interface Statement {
	num: number; // its number in the day, the name of its text in the bucket
	name: string; // who spoke
	function?: string; // as whom: "Poseł", "Marszałek", "Minister ..."
	club?: string;
	memberID?: number;
	startDateTime?: string;
	endDateTime?: string;
	[field: string]: unknown;
}
