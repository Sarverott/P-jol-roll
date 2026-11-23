// what a host of the viewer is (phase 28, /api/host): the release, how it was made and where
// it runs, so the viewer's corner can say at a glance what is in front of a reader
export default interface Host {
	version: string; // the release: "0.24.3"
	commit: string; // the commit it was built from, "" when not known
	run: string; // the address of the workflow's run that built it, "" when built by hand
	container: boolean; // the image of webapp-server (resources/configs/webapp-server)
	production: boolean; // NODE_ENV=production
	huggingface: string; // the space it runs in (SPACE_ID of Hugging Face), "" elsewhere
	remote: boolean; // the dataset read from its copy on Hugging Face (remote.ts), not gathered here
	writing: boolean; // writing functions started here (--allow-writing, Q19)
	label: string; // the short name of all of it: "HF-demo-readonly-container"
}
