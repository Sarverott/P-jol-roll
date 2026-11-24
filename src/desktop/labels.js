/*
A label of an act for a sticker printer (phase 40, Q17): ESC/POS, the language of thermal
printers - its ELI in bold, its title cut to the width of the roll, and a QR code of its address
that the printer draws itself (GS ( k). Letters with Polish marks are written without them: the
code pages of small printers differ, plain ASCII prints on every one.
*/

const ESC = 0x1b;
const GS = 0x1d;
const PLAIN = {
	ą: "a",
	ć: "c",
	ę: "e",
	ł: "l",
	ń: "n",
	ó: "o",
	ś: "s",
	ź: "z",
	ż: "z",
	Ą: "A",
	Ć: "C",
	Ę: "E",
	Ł: "L",
	Ń: "N",
	Ó: "O",
	Ś: "S",
	Ź: "Z",
	Ż: "Z",
	"„": '"',
	"”": '"',
	"–": "-",
	"—": "-",
	"§": "par.",
};

export const ascii = (text) =>
	[...text]
		.map((sign) => PLAIN[sign] ?? sign)
		.join("")
		.normalize("NFKD")
		.replace(/[^\x20-\x7e]/g, "");

// words into lines of a width, a word longer than a line cut
export function wrap(text, width) {
	const lines = [];
	let line = "";
	for (const word of text.split(/\s+/).filter(Boolean)) {
		for (let piece = word; piece; piece = piece.slice(width)) {
			const part = piece.slice(0, width);
			if (!line) line = part;
			else if (line.length + 1 + part.length <= width) line += ` ${part}`;
			else {
				lines.push(line);
				line = part;
			}
		}
	}
	if (line) lines.push(line);
	return lines;
}

const text = (value) => [...Buffer.from(ascii(value), "ascii")];

// the QR code of model 2 the printer draws: size of its modules, error correction M, the data
function qr(data, size = 6) {
	const bytes = text(data);
	const length = bytes.length + 3;
	return [
		...[GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0], // model 2
		...[GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, size], // module size
		...[GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31], // error correction M
		...[GS, 0x28, 0x6b, length & 0xff, length >> 8, 0x31, 0x50, 0x30, ...bytes],
		...[GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30], // print it
	];
}

// {eli, title, url} -> the bytes of one label; width: signs on a line (32 on 58 mm rolls)
export function label({ eli, title, url }, { width = 32, lines = 4 } = {}) {
	const titleLines = wrap(title ?? "", width);
	const shown = titleLines.slice(0, lines);
	if (titleLines.length > lines)
		shown[lines - 1] = `${shown[lines - 1].slice(0, width - 3)}...`;
	return [
		ESC,
		0x40, // reset
		ESC,
		0x61,
		1, // centred
		ESC,
		0x45,
		1,
		...text(eli),
		0x0a,
		ESC,
		0x45,
		0, // the ELI in bold
		...shown.flatMap((line) => [...text(line), 0x0a]),
		...(url ? [0x0a, ...qr(url), 0x0a] : []),
		...text("P_JOL_ROLL"),
		0x0a,
		0x0a,
		0x0a,
		0x0a,
		GS,
		0x56,
		0x42,
		0, // feed and cut, where the printer cuts
	];
}
