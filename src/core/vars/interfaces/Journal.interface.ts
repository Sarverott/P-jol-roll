// journal with years whose listings are gathered here
export default interface Journal {
	code: string; // "DU", "MP"
	name?: string; // from lists/publishers.json, when gathered
	years: number[];
}
