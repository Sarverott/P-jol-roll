import { ref } from "vue";

/*
Where the viewer is, kept in the address after "#", so a screen or an act can be linked,
bookmarked and opened by the desktop app (p-jol-roll://act/DU/2026/1):
  #acts             the acts of a year, or found in every year
  #act/DU/2026/1    one act: its text and its ties
  #map              the map of the whole law
  #data             the rest of the dataset: the work of Sejm, judgments, the lists of the source
Tabs and links are plain <a href>, so the browser's back and forward move between them.
*/

export const SCREENS = ["acts", "act", "map", "data"];

export function parse(hash) {
	const [screen, ...rest] = hash.replace(/^#\/?/, "").split("/");
	if (screen === "act" && rest.length === 3)
		return { screen, eli: rest.join("/") };
	return { screen: SCREENS.includes(screen) ? screen : "acts", eli: "" };
}

export const href = (screen, eli = "") =>
	eli ? `#${screen}/${eli}` : `#${screen}`;

export function useRoute() {
	const route = ref(parse(globalThis.location?.hash ?? ""));
	const follow = () => {
		route.value = parse(location.hash);
	};
	addEventListener("hashchange", follow);
	return { route, stop: () => removeEventListener("hashchange", follow) };
}
