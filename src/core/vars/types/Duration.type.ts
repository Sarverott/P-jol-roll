// time as the Workflow SDK sleeps it: "5s", "30m", "12h", "3d", "1w"
type Duration = `${number}${"s" | "m" | "h" | "d" | "w"}`;

export default Duration;
