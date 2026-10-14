// answer of a person to a daily run that waits before pushing
export default interface Approval {
	push: boolean;
	by?: string; // who answered, written into the event log
}
