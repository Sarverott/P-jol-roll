// every type of the core, one per file next to this index - namespaces say which side of work it belongs to
import type ActAddressType from "./ActAddress.type.js";
import type DurationType from "./Duration.type.js";
import type GroupType from "./Group.type.js";
import type IndexType from "./Index.type.js";
import type ListedType from "./Listed.type.js";
import type PartType from "./Part.type.js";
import type ReferencesType from "./References.type.js";
import type ResourcesMapType from "./ResourcesMap.type.js";
import type ValuesType from "./Values.type.js";
import type WayType from "./Way.type.js";

export namespace HuggingfaceScope {
	export type ResourcesMap = ResourcesMapType;
}

export namespace GatheringScope {
	export type ActAddress = ActAddressType;
	export type Index = IndexType;
	export type Listed = ListedType;
	export type Part = PartType;
	export type References = ReferencesType;
}

// durable runs of src/workflows
export namespace WorkflowScope {
	export type Duration = DurationType;
}

// the catalog of functions (src/core/catalog/): groups, ways, values given to parameters
export namespace CatalogScope {
	export type Group = GroupType;
	export type Way = WayType;
	export type Values = ValuesType;
}
