// a line of dataset/texts/{journal}/{year}.jsonl
export default interface TextRecord {
	ELI: string;
	markdown: string; // path inside of dataset
	sha256_md: string;
	from?: "pdf"; // left out: made from html (every record before phase 12)
	sha256_html?: string;
	sha256_pdf?: string;
	producer?: string; // of the PDF, as pdfinfo names it: "Paper Capture" means recognised text of a scan
	url: string; // the file at the source it was made from
}
