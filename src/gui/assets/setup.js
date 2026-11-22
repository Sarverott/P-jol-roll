/*
Every colour of the viewer in one place: the drawings (the map, the minimap) ask ColorPick by
name, and the styles of the components read the same colours as CSS variables (--p-<name>),
laid on the viewer's root by ColorPick.paint(). The brand is the navy of the images of the
project (resources/mediafiles).
*/
// NOTE: instead of making `colour` and `COLOURS` make for example class object ColorPick with static methods and static parameters
// ANSWER: done - ColorPick below; the map, the minimap and the styles of the viewer take every colour from it

// biome-ignore lint/complexity/noStaticOnlyClass: one class of static colours and methods is what the viewer asks by name (the owner's note above)
export class ColorPick {
	// a colour per kind: of acts on the map, of ties on the minimap
	static KINDS = [
		"#c0392b",
		"#2e86c1",
		"#28b463",
		"#d68910",
		"#8e44ad",
		"#17a589",
		"#7f8c8d",
		"#b9770e",
		"#1d2440",
		"#e84393",
	];

	static NAMED = {
		brand: "#1d2440", // the header, the act in the middle of the minimap
		"brand-text": "#f3efe4",
		lit: "#c0392b", // the ties of the act under the pointer
		dimmed: "#c9ced8", // acts away from the one under the pointer
		edge: "#9aa3b866", // a tie at rest: grey, two thirds transparent
		node: "#5f6b8a", // an act around the one in the middle
		"node-label": "#888",
	};

	// labels must read on the page's own background
	static LABELS = { dark: "#ddd", light: "#222" };

	static kind(index) {
		return ColorPick.KINDS[index % ColorPick.KINDS.length];
	}

	static named(name) {
		const found = ColorPick.NAMED[name];
		if (!found) throw new Error(`no colour named ${name}`);
		return found;
	}

	static dark() {
		return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches;
	}

	static label() {
		return ColorPick.dark() ? ColorPick.LABELS.dark : ColorPick.LABELS.light;
	}

	// the named colours as --p-<name> on an element, for the styles under it
	static paint(element) {
		for (const [name, colour] of Object.entries(ColorPick.NAMED))
			element.style.setProperty(`--p-${name}`, colour);
	}
}
