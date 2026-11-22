import { readFileSync } from "node:fs";
import { join } from "node:path";

// a file of the repository read as text while the website is built - plain node:fs, run in
// the root of the project (npm run build, task web:build, the image of webapp-server)
export const readText = (path: string) =>
	readFileSync(join(process.cwd(), path), "utf8");
