// what the mastermind answered (phase 30, src/mastermind): the answer, the acts it cites and
// whether it read each of them through the MCP tools, and every tool it called on the way
export default interface Advice {
	question: string;
	answer: string; // the answer without the model's reasoning
	thinking: string; // the reasoning of a thinking model (deepseek-R1), "" when it gave none
	cited: { ELI: string; read: boolean }[]; // read: opened by act, act_text or act_references
	steps: { tool: string; arguments: Record<string, unknown>; ok: boolean }[];
	model: string;
	rounds: number; // the rounds of the conversation with the model
	record: string; // where the conversation is kept (resources/conversations/...), "" when not
}
