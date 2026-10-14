export default interface Difference {
	upload: string[]; // here and not there
	changed: string[]; // on both sides with other content
	download: string[]; // there and not here
	same: number;
}
