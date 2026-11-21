// The introduction page, built into ../site beside the MkDocs site, which lies in ../site/docs
// (scripts/devops/pages/build.sh builds MkDocs first, so this build must not empty site/).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	base: "./",
	build: { outDir: "../site", emptyOutDir: false },
});
