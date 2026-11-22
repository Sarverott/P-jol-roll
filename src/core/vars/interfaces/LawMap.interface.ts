// dataset/map/{preset}.json: the acts of a preset placed on a plane by task map, compact -
// a node is [ELI, title, x, y, size, kind], an edge [from, to, tie] by places in the lists
export default interface LawMap {
	preset: string;
	description: string;
	made: string; // when task map made it
	kinds: string[]; // types of acts, a colour each
	ties: string[]; // kinds of ties
	nodes: [string, string, number, number, number, number][];
	edges: [number, number, number][];
}
