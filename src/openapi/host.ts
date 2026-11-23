import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { remote } from "../core/reading/remote.js";
import type { CatalogScope } from "../core/vars/interfaces/index.js";
import { spec } from "./spec.js";

/*
What this host is (phase 28, the owner's order): the release, the commit and the run that built
it, and where it runs - so the viewer's corner shows "v0.24.3 · HF-demo-readonly-container" and,
on a hover or a touch, all of it. The image of webapp-server is given the commit and the run as
build arguments by the release (scripts/devops/release/container.sh); Hugging Face gives every
space its SPACE_ID; outside an image the commit is asked from git once.
*/
const setting = (name: string) => process.env[name]?.trim() ?? "";

function commitHere() {
	const given = setting("P_JOL_ROLL_COMMIT");
	if (given) return given;
	try {
		return execFileSync("git", ["rev-parse", "HEAD"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return "";
	}
}

const COMMIT = commitHere();

export function host(writing: boolean): CatalogScope.Host {
	const container =
		setting("P_JOL_ROLL_CONTAINER") !== "" || existsSync("/.dockerenv");
	const huggingface = setting("SPACE_ID");
	const where = huggingface ? "HF-demo" : remote ? "remote" : "local";
	const label = [where, writing ? "writing" : "readonly"]
		.concat(container ? ["container"] : [])
		.join("-");
	return {
		version: spec.info.version,
		commit: COMMIT,
		run: setting("P_JOL_ROLL_RUN"),
		container,
		production: setting("NODE_ENV") === "production",
		huggingface,
		remote,
		writing,
		label,
	};
}
