import { defineConfig } from "nitro";

// read by nitro, not by tsc (tsconfig.json excludes it): its types of the workflow option do not reach here
// durable runs of the gatherer: "task workflows:build", "task workflows:serve", runs seen by "npx workflow web"
export default defineConfig({
	serverDir: "./server",
	modules: ["workflow/nitro"],
	workflow: { dirs: ["./flows"] },
}); // NOTE: i tested it once but nothing was there. interface looks like workflows here are missing
// ANSWER: the web interface looked for the list of workflows in the folder it was started in, and
// Nitro writes it into its build (node_modules/.nitro/workflow/manifest.json); task workflows:web
// now names it and the runs of workflows:serve, and "daily" is listed. Runs appear after
// task workflows:daily - none was started yet, so the list of runs is empty until then
