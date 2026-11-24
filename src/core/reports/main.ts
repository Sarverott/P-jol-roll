import { createInterface } from "node:readline/promises";
import { draft, drafts, reportsDir, send } from "./reports.js";

/*
task report:draft            the problems found, drafted with their evidence (resources/reports/drafts/)
task report:send -- <draft>  one draft shown, a person's yes asked at a terminal, then sent
Phase 45, Q20. An agent drafts; only a person sends.
*/

const [command, path] = process.argv.slice(2);
if (command === "draft") {
	const made = await draft();
	console.log(made.length ? made.join("\n") : "nothing to report");
	console.log(`${drafts().length} draft(s) in ${reportsDir()}/drafts`);
} else if (command === "send" && path) {
	if (!process.stdin.isTTY) {
		console.error("a report is sent only after a person's yes, at a terminal");
		process.exit(1);
	}
	const prompt = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	const done = await send(path, async (shown) => {
		console.log(`\n${shown}`);
		return (await prompt.question("send it? [y/N] ")).trim() === "y";
	});
	prompt.close();
	console.log(
		done.sent ? `sent: ${done.messageId}, kept in ${done.path}` : "not sent",
	);
} else {
	console.error("task report:draft | task report:send -- <draft>");
	process.exit(2);
}
