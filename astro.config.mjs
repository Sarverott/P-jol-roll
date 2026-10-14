// website of src/web, built into dist/web - "task web:build", "task web:dev"
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

export default defineConfig({
	srcDir: "./src/web",
	publicDir: "./src/web/public",
	outDir: "./dist/web",
	integrations: [vue()],
	telemetry: false,
});
