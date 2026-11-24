import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";

// an act in Sejm (phase 35): the process that ended with it, the stages read on sittings, the
// statements of those days and their texts - written here, as task sejm and task sittings would
const work = await mkdtemp(join(tmpdir(), "p-jol-roll-debates-"));
const resources = join(work, "resources");
process.env.RESOURCES_DIR = resources;
process.env.WEB_DIR = join(work, "no-web");
const put = async (path: string, content: unknown) => {
	await mkdir(join(resources, path, ".."), { recursive: true });
	await writeFile(
		join(resources, path),
		typeof content === "string" ? content : JSON.stringify(content),
	);
};
await put(
	"dataset/sejm/term10/processes.jsonl",
	`${JSON.stringify({ term: 10, number: "1058", title: "Projekt o ratownictwie", ELI: "DU/2025/637" })}\n${JSON.stringify({ term: 10, number: "9", title: "inny", ELI: "DU/2025/1" })}\n`,
);
await put("bucket/sejm/term10/processes/1058.json", {
	number: "1058",
	stages: [
		{
			stageName: "Projekt wpłynął do Sejmu",
			date: "2025-02-19",
			printNumber: "1058",
		},
		{
			stageName: "Praca w komisjach",
			date: "2025-03-06",
			children: [
				{
					stageName: "Sprawozdanie komisji",
					date: "2025-03-18",
					printNumber: "1111",
				},
			],
		},
		{
			stageName: "II czytanie na posiedzeniu Sejmu",
			date: "2025-03-19",
			sittingNum: 31,
			decision: "skierowano ponownie do komisji",
		},
		{
			stageName: "III czytanie na posiedzeniu Sejmu",
			date: "2025-03-21",
			sittingNum: 31,
		},
	],
});
// the journals the api knows (an address of another is refused)
await put("dataset/lists/publishers.json", [
	{ code: "DU", name: "Dziennik Ustaw" },
]);
await put("dataset/acts/DU/2025.jsonl", "");
await put("dataset/sejm/term10/sittings.json", [
	{ number: 31, title: "31. Posiedzenie", dates: ["2025-03-19", "2025-03-21"] },
]);
await put("dataset/sejm/term10/transcripts/31/2025-03-19.json", {
	statements: [
		{ num: 0, name: "Szymon Hołownia", function: "Marszałek" },
		{
			num: 7,
			name: "Katarzyna Stachowicz",
			function: "Poseł Sprawozdawca",
			club: "KO",
		},
		{ num: 8, name: "Jan Kowalski", function: "Poseł", club: "PiS" },
	],
});
await put(
	"bucket/sejm/term10/transcripts/31/2025-03-19/0.html",
	"<p>Otwieram posiedzenie.</p>",
);
await put(
	"bucket/sejm/term10/transcripts/31/2025-03-19/7.html",
	"<p>Wysoka Izbo! Przedstawiam sprawozdanie komisji (druk nr 1111) o&nbsp;projekcie.</p>",
);
await put(
	"bucket/sejm/term10/transcripts/31/2025-03-19/8.html",
	"<p>O drukach nr 11110 i 2058 - nie o tym.</p>",
);

const { serve } = await import("../src/openapi/server.js");
const { server, url } = await serve({ port: 0 });
afterAll(() => server.close());

test("an act's debates: the days its bill was read on, the statements naming its print", async () => {
	const { debates } = await import("../src/core/reading/debates.js");
	const debate = await debates("DU/2025/637");
	expect(debate.processes).toEqual([
		{ term: 10, number: "1058", title: "Projekt o ratownictwie" },
	]);
	expect(
		debate.days.map((day) => [day.date, day.sitting, day.gathered]),
	).toEqual([
		["2025-03-19", 31, true],
		["2025-03-21", 31, false], // its transcript not gathered yet
	]);
	const [day] = debate.days;
	expect(day.decision).toBe("skierowano ponownie do komisji");
	expect(day.statements.map((one) => [one.num, one.about])).toEqual([
		[0, false],
		[7, true],
		[8, false], // 11110 and 2058 are not 1111 nor 1058
	]);
	expect(day.statements[1].text).toContain("druk nr 1111");
	expect((await debates("DU/1999/1")).days).toEqual([]);
});

test("act_debates gives the statements about the bill; the api gives the whole", async () => {
	const { connect } = await import("../src/mcp/client.js");
	const client = await connect(`${url}/mcp`);
	try {
		const result = await client.callTool({
			name: "act_debates",
			arguments: { eli: "DU/2025/637" },
		});
		const said = JSON.parse(
			(result.content as { text: string }[]).map((one) => one.text).join(""),
		);
		expect(
			said.days[0].statements.map((one: { num: number }) => one.num),
		).toEqual([7]);
		expect(said.days[1].statements).toEqual([]);
	} finally {
		await client.close();
	}
	const whole = await (
		await fetch(`${url}/api/acts/DU/2025/637/debates`)
	).json();
	expect(whole.days[0].statements).toHaveLength(3);
});
