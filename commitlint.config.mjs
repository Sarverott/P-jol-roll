// Every commit message is a conventional commit: <type>(<scope>): <subject>
// One finished step of docs/devlog/TODO.md is one commit (the craft loop of BOS).
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"header-max-length": [2, "always", 100],
		"body-max-line-length": [0], // bodies list files and versions, lines can be long
		"footer-max-line-length": [0],
		"subject-case": [0], // subjects may start with a name, e.g. "README rewritten"
	},
};
