import { reactive, watch } from "vue";

/*
The viewer's settings (screens/settingsPanel.vue): kept in this browser only (localStorage),
so each person keeps their own; a browser that refuses storage gets the defaults every time.
*/

// the name the settings are stored under in localStorage
const STORED_AS = "p-jol-roll:settings";

export const DEFAULTS = {
	theme: "auto", // auto (as the system), light, dark - Bulma's data-theme
	speed: 1, // years of the history per second (screens/statisticsHistory.vue)
	mapPreset: "", // the map shown first; empty: the first one made
	webmcp: true, // the reading tools offered to an agent in the browser (assets/webmcp.js)
	minimap: true, // the minimap of ties beside the acts
};

function stored() {
	try {
		return JSON.parse(localStorage.getItem(STORED_AS) ?? "{}");
	} catch {
		return {};
	}
}

export const settings = reactive({ ...DEFAULTS, ...stored() });

watch(
	settings,
	(now) => {
		try {
			localStorage.setItem(STORED_AS, JSON.stringify(now));
		} catch {
			// private windows and refused storage: the settings last as long as the page
		}
	},
	{ deep: true },
);

// the theme laid on the page: Bulma follows data-theme, or the system when it is missing
export function applyTheme(theme = settings.theme) {
	const root = globalThis.document?.documentElement;
	if (!root) return;
	if (theme === "auto") root.removeAttribute("data-theme");
	else root.setAttribute("data-theme", theme);
}

export const reset = () => Object.assign(settings, DEFAULTS);
