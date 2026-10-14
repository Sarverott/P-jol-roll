import type { GatheringScope as Interfaces } from "../interfaces/index.js";

type ActAddress = Pick<Interfaces.Act, "publisher" | "year" | "address">;

export default ActAddress;
