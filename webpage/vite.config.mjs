// The introduction page, built into ../site beside the MkDocs site, which lies in ../site/docs
// (scripts/devops/pages/build.sh builds MkDocs first, so this build must not empty site/).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { parse } from "yaml";

// the data of the page (src/data/*.yaml) imported as plain values, read once at build
const yamlData = {
	name: "yaml-data",
	enforce: "pre",
	transform(code, id) {
		if (!id.endsWith(".yaml")) return;
		return {
			code: `export default ${JSON.stringify(parse(code))};`,
			map: null,
		};
	},
};

export default defineConfig({
	plugins: [yamlData, react()],
	base: "./",
	// the icons and the card of a link, the same as the viewer's (scripts/devops/media/build.sh)
	publicDir: "../src/web/public",
	build: { outDir: "../site", emptyOutDir: false },
});
