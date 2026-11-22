// one line of a menu of the launcher (src/tui/), and what choosing it gives back
export default interface MenuOption<Value> {
	label: string;
	hint?: string; // shown dimmed after the label
	value: Value;
}
