// a line of dataset/texts/{journal}/{year}.scans.jsonl: a PDF without a text layer, waiting for OCR
export default interface ScanRecord {
	ELI: string;
	sha256_pdf: string;
	producer?: string;
	url: string; // the PDF at the source
}
