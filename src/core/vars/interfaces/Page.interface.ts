// one page of anything read in pages: processes and prints of Sejm, judgments
export default interface Page<Item> {
	total: number; // items that match, on all pages
	offset: number;
	items: Item[];
}
