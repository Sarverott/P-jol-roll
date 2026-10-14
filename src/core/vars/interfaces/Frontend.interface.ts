// website that shows acts to people: address with {ELI} {address} {year} {pos},
// one for all journals or one per journal
export default interface Frontend {
	title: string;
	url: string | Record<string, string>;
}
