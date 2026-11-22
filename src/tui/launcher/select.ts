// A menu in the terminal: ↑/↓ (or k/j) moves, Enter chooses, Esc or q goes back (null).
// A typed number chooses that line at once. Nothing but node:readline.
import { emitKeypressEvents } from "node:readline";
import type { LaunchingScope } from "../../core/vars/interfaces/index.js";

const ESC = "\u001b[";
const dim = (text: string) => `${ESC}2m${text}${ESC}22m`;
const bold = (text: string) => `${ESC}1m${text}${ESC}22m`;

export function select<Value>(
	title: string,
	options: LaunchingScope.MenuOption<Value>[],
): Promise<Value | null> {
	const input = process.stdin;
	const output = process.stdout;
	let at = 0;
	let drawn = 0;

	const draw = () => {
		if (drawn) output.write(`${ESC}${drawn}A${ESC}0J`);
		const lines = [
			bold(title),
			...options.map((option, i) => {
				const mark = i === at ? "›" : " ";
				const number = String(i + 1).padStart(2);
				const label = i === at ? bold(option.label) : option.label;
				return ` ${mark} ${dim(number)} ${label}${option.hint ? `  ${dim(option.hint)}` : ""}`;
			}),
			dim("↑/↓ move · Enter choose · number jumps · Esc back"),
		];
		output.write(`${lines.join("\n")}\n`);
		drawn = lines.length;
	};

	return new Promise((resolve) => {
		emitKeypressEvents(input);
		if (input.isTTY) input.setRawMode(true);
		input.resume();
		const done = (value: Value | null) => {
			input.off("keypress", onKey);
			if (input.isTTY) input.setRawMode(false);
			input.pause();
			resolve(value);
		};
		const onKey = (text: string, key: { name?: string; ctrl?: boolean }) => {
			if (key.ctrl && key.name === "c") {
				done(null);
				process.exit(130);
			}
			if (key.name === "up" || key.name === "k")
				at = (at + options.length - 1) % options.length;
			else if (key.name === "down" || key.name === "j")
				at = (at + 1) % options.length;
			else if (key.name === "return") return done(options[at].value);
			else if (key.name === "escape" || key.name === "q") return done(null);
			else if (/^[1-9]$/.test(text ?? "") && Number(text) <= options.length)
				at = Number(text) - 1;
			draw();
		};
		input.on("keypress", onKey);
		draw();
	});
}
