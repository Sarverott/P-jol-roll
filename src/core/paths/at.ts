import { fileURLToPath } from "node:url";

/*
Where the repository stands, wherever a command was started from:
  at("package.json") -> /home/.../P-jol-roll/package.json
Scripts that node runs without tsx (src/devtools/) import it as "../core/paths/at.ts";
tsc rewrites that ending to .js in dist (rewriteRelativeImportExtensions).
*/

export const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export const at = (file: string) => `${ROOT}${file}`;
