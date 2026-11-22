import { readText } from "../data/files.ts";

// the web app manifest (src/app/manifest.json, the android app's too), served as it is
export const GET = () =>
	new Response(readText("src/app/manifest.json"), {
		headers: { "Content-Type": "application/manifest+json" },
	});
