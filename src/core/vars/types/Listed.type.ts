import type { GatheringScope as Interfaces } from "../interfaces/index.js";

type Listed = Pick<Interfaces.Act, "ELI" | "textPDF" | "textHTML">;

export default Listed;
