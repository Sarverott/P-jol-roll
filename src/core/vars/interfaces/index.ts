// every interface of the core, one per file next to this index - namespaces say which side of work it belongs to

import type ActInterface from "./Act.interface.js";
import type ActFileInterface from "./ActFile.interface.js";
import type ActPageInterface from "./ActPage.interface.js";
import type ActTextInterface from "./ActText.interface.js";
import type ActViewInterface from "./ActView.interface.js";
import type ApprovalInterface from "./Approval.interface.js";
import type AskedInterface from "./Asked.interface.js";
import type ChainInterface from "./Chain.interface.js";
import type ChangesInterface from "./Changes.interface.js";
import type CheckupInterface from "./Checkup.interface.js";
import type CheckupPlanInterface from "./CheckupPlan.interface.js";
import type CommandResultInterface from "./CommandResult.interface.js";
import type DailyPlanInterface from "./DailyPlan.interface.js";
import type DifferenceInterface from "./Difference.interface.js";
import type EdgeInterface from "./Edge.interface.js";
import type FileRecordInterface from "./FileRecord.interface.js";
import type FrontendInterface from "./Frontend.interface.js";
import type GatherPlanInterface from "./GatherPlan.interface.js";
import type JournalInterface from "./Journal.interface.js";
import type JudgmentInterface from "./Judgment.interface.js";
import type LawMapInterface from "./LawMap.interface.js";
import type MapPresetInterface from "./MapPreset.interface.js";
import type MenuOptionInterface from "./MenuOption.interface.js";
import type PageInterface from "./Page.interface.js";
import type ParameterInterface from "./Parameter.interface.js";
import type PrintInterface from "./Print.interface.js";
import type ProcedureInterface from "./Procedure.interface.js";
import type ProcessInterface from "./Process.interface.js";
import type PublisherInterface from "./Publisher.interface.js";
import type RemoteFileInterface from "./RemoteFile.interface.js";
import type RuleInterface from "./Rule.interface.js";
import type SaosPlanInterface from "./SaosPlan.interface.js";
import type ScanRecordInterface from "./ScanRecord.interface.js";
import type SearchPageInterface from "./SearchPage.interface.js";
import type SejmPlanInterface from "./SejmPlan.interface.js";
import type StatisticsInterface from "./Statistics.interface.js";
import type TaskEntryInterface from "./TaskEntry.interface.js";
import type TermInterface from "./Term.interface.js";
import type TextOriginInterface from "./TextOrigin.interface.js";
import type TextRecordInterface from "./TextRecord.interface.js";
import type YearCountInterface from "./YearCount.interface.js";
import type YearListingInterface from "./YearListing.interface.js";
import type YearWorkInterface from "./YearWork.interface.js";

// the almanac (docs/almanac/): chains of events met before and the rules of the project
export namespace AlmanacScope {
	export type Chain = ChainInterface;
	export type Rule = RuleInterface;
}

export namespace HuggingfaceScope {
	export type Difference = DifferenceInterface;
	export type RemoteFile = RemoteFileInterface;
}

export namespace GatheringScope {
	export type Act = ActInterface;
	export type ActFile = ActFileInterface;
	export type ActText = ActTextInterface;
	export type Asked = AskedInterface;
	export type Changes = ChangesInterface;
	export type Checkup = CheckupInterface;
	export type CheckupPlan = CheckupPlanInterface;
	export type Edge = EdgeInterface;
	export type FileRecord = FileRecordInterface;
	export type Frontend = FrontendInterface;
	export type GatherPlan = GatherPlanInterface;
	export type Judgment = JudgmentInterface;
	export type Print = PrintInterface;
	export type Process = ProcessInterface;
	export type Publisher = PublisherInterface;
	export type SaosPlan = SaosPlanInterface;
	export type ScanRecord = ScanRecordInterface;
	export type SejmPlan = SejmPlanInterface;
	export type Term = TermInterface;
	export type TextRecord = TextRecordInterface;
	export type YearListing = YearListingInterface;
	export type YearWork = YearWorkInterface;
}

// what readers of gathered data get: server, MCP, interfaces
export namespace ReadingScope {
	export type Journal = JournalInterface;
	export type ActPage = ActPageInterface;
	export type ActView = ActViewInterface;
	export type TextOrigin = TextOriginInterface;
	export type LawMap = LawMapInterface;
	export type MapPreset = MapPresetInterface;
	export type SearchPage = SearchPageInterface;
	export type Page<Item> = PageInterface<Item>;
	export type Statistics = StatisticsInterface;
	export type YearCount = YearCountInterface;
}

// durable runs of src/workflows: what they are asked, what their steps return
export namespace WorkflowScope {
	export type DailyPlan = DailyPlanInterface;
	export type CommandResult = CommandResultInterface;
	export type Approval = ApprovalInterface;
}

// the launcher of src/tui/ and the commands of src/cli/: tasks of every Taskfile, menus
export namespace LaunchingScope {
	export type TaskEntry = TaskEntryInterface;
	export type MenuOption<Value> = MenuOptionInterface<Value>;
}

// the catalog of functions (src/core/catalog/): every function once, for every way in
export namespace CatalogScope {
	export type Procedure = ProcedureInterface;
	export type Parameter = ParameterInterface;
}
