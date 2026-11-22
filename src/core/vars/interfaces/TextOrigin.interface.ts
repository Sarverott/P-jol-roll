// where the markdown of an act was made from: its HTML, or the text layer of its PDF
export default interface TextOrigin {
	from: "html" | "pdf";
	producer?: string; // of the PDF: "Paper Capture" means text recognised from a scan, with its mistakes
	url: string; // the file at the source
}
