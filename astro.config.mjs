// website of src/web, built into dist/web - "task web:build", "task web:dev"

import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const BUILT =
	/(^|\/)(node_modules|\.output|\.nitro|\.workflow-data|dist|out)(\/|$)/;
// true for every path the dev server should not watch: all but src/ and the config
function outsideSource(path) {
	const rel = relative(root, path);
	if (!rel) return false;
	if (rel === "astro.config.mjs" || rel === "package.json") return false;
	if (rel !== "src" && !rel.startsWith("src/")) return true;
	return BUILT.test(rel);
}

export default defineConfig({
	srcDir: "./src/web",
	publicDir: "./src/web/public",
	outDir: "./dist/web",
	integrations: [vue()],
	telemetry: false,
	// the root of the project is the root of the website too, so the dev server watched all
	// of it - resources/ alone holds hundreds of thousands of files and ran out of the
	// system's file watchers (ENOSPC); only src/ (without builds and installs) is watched
	vite: { server: { watch: { ignored: outsideSource } } },
});
