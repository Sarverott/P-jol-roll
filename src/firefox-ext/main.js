// NOTE: firefox web extension here

/*
Popup that asks a P_JOL_ROLL host (task serve, or a self-hosted one) about an
act. The address of the page in the open tab fills the field when it names an
act: ISAP, the reader of Sejm, dziennikustaw.gov.pl. Manifest v3, so Chrome
loads this directory too (it only warns about the gecko key).
*/

const ext = globalThis.browser ?? globalThis.chrome;
const DEFAULT_API = "http://127.0.0.1:8080";
const $ = (id) => document.getElementById(id);

// "DU/2026/1", "Dz.U. 2026 poz. 1", "M.P. 2026 poz. 5", ISAP "WDU20260000001", eli/acts/DU/2026/1
function eliOf(text) {
	const plain = /\b(DU|MP)\/(\d{4})\/(\d+)\b/.exec(text);
	if (plain) return `${plain[1]}/${plain[2]}/${plain[3]}`;
	const cited =
		/\b(Dz\.\s?U\.|M\.\s?P\.)\s*(?:z\s*)?(\d{4})\D+?poz\.\s*(\d+)/i.exec(text);
	if (cited)
		return `${/^Dz/i.test(cited[1]) ? "DU" : "MP"}/${cited[2]}/${cited[3]}`;
	const address = /\b(WDU|WMP)(\d{4})(\d{3})(\d{4})\b/.exec(text);
	if (address)
		return `${address[1].slice(1)}/${address[2]}/${Number(address[4])}`;
}

const line = (tag, text) => {
	const node = document.createElement(tag);
	node.textContent = text;
	return node;
};

async function look(eli) {
	const answer = $("answer");
	answer.replaceChildren();
	const api = ($("api").value || DEFAULT_API).replace(/\/$/, "");
	try {
		const response = await fetch(`${api}/api/acts/${eli}`);
		if (response.status === 404)
			return answer.append(line("p", `${eli} is not gathered in ${api}`));
		const { act, files, markdown } = await response.json();
		const ties = await (
			await fetch(`${api}/api/acts/${eli}/references`)
		).json();
		answer.append(
			line("h3", act.title),
			line(
				"p",
				`${act.displayAddress ?? act.ELI} · ${act.type} · ${act.status}`,
			),
			line(
				"small",
				`${ties.length} ties to other acts · files: ${files.join(" ")}`,
			),
		);
		const links = document.createElement("p");
		for (const [label, path] of [
			["text", markdown ? `/api/acts/${eli}/text` : ""],
			["pdf", files.includes(".pdf") ? `/api/acts/${eli}/file/.pdf` : ""],
		]) {
			if (!path) continue;
			const link = line("a", label);
			link.href = `${api}${path}`;
			link.target = "_blank";
			links.append(link, " ");
		}
		answer.append(links);
	} catch (error) {
		answer.append(
			line("p", `the host does not answer: ${error.message}`),
		).lastChild.className = "failure";
	}
}

$("look").addEventListener("submit", (event) => {
	event.preventDefault();
	const eli = eliOf($("eli").value);
	if (eli) look(eli);
	else $("answer").replaceChildren(line("p", "no act in that text"));
});
$("api").addEventListener("change", () =>
	ext.storage.local.set({ api: $("api").value }),
);

const { api } = await ext.storage.local.get("api");
$("api").value = api ?? "";
const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
const fromTab = tab?.url && eliOf(decodeURIComponent(tab.url));
if (fromTab) {
	$("eli").value = fromTab;
	look(fromTab);
}
