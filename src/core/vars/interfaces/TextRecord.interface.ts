// a line of dataset/texts/{journal}/{year}.jsonl
export default interface TextRecord {
	ELI: string;
	markdown: string; // path inside of dataset
	sha256_md: string;
	sha256_html: string;
	url: string; // html at the source
}
