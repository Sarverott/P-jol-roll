// Every source into the one bucket and the one dataset (phase 10 of the devlog): the
// directories each source had of its own are moved inside, file by file, never over a file
// that is there already (that one is named and left). Empty directories left behind go.
//   resources/sejm-dataset  -> resources/dataset/sejm
//   resources/sejm-bucket   -> resources/bucket/sejm
//   resources/saos-dataset  -> resources/dataset/SAOS
// task resources:merge; RESOURCES_DIR points elsewhere as for every command. Local only:
// sending the result to Hugging Face is the owner's `task resources:push`.
import {
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	rmdirSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const RESOURCES = process.env.RESOURCES_DIR?.trim() || "resources";

export const MOVES: [string, string][] = [
	["sejm-dataset", "dataset/sejm"],
	["sejm-bucket", "bucket/sejm"],
	["saos-dataset", "dataset/SAOS"],
];

// moves what is in from into to; gives back how many files moved and which were left
export function merge(from: string, to: string) {
	const left: string[] = [];
	let moved = 0;
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(path);
				continue;
			}
			const target = join(to, relative(from, path));
			if (existsSync(target)) {
				left.push(path);
				continue;
			}
			mkdirSync(dirname(target), { recursive: true });
			renameSync(path, target);
			moved++;
		}
		if (readdirSync(dir).length === 0) rmdirSync(dir);
	};
	walk(from);
	return { moved, left };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	for (const [from, to] of MOVES) {
		const source = join(RESOURCES, from);
		if (!existsSync(source)) continue;
		const { moved, left } = merge(source, join(RESOURCES, to));
		console.log(`${source} -> ${join(RESOURCES, to)}: ${moved} files moved`);
		for (const path of left)
			console.log(`  left, the same name is there already: ${path}`);
	}
}
