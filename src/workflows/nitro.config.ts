import { defineConfig } from "nitro";

// read by nitro, not by tsc (tsconfig.json excludes it): its types of the workflow option do not reach here
// durable runs of the gatherer: "task workflows:build", "task workflows:serve", runs seen by "npx workflow web"
export default defineConfig({
	serverDir: "./server",
	modules: ["workflow/nitro"],
	workflow: { dirs: ["./flows"] },
});
