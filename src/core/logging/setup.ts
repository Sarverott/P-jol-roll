// Rich logging (Q1 of the devlog): every command logs through the one logger that crawlee
// uses too (@apify/log), so gathering, parsing and the hosts write the same kind of lines.
//   LOG_FORMAT=json        one JSON object per line (time, level, message and the data given)
//   LOG_LEVEL=debug        less or more than info (error, warning, info, debug)
//   SYSLOG_ADDRESS=udp://127.0.0.1:5514   each line also to syslog, as RFC 5424 - the
//                          log-collector service of compose listens there
// Empty values (spaces count as empty) leave the defaults: text lines, info, no syslog.
// Imported first by every entry point (src/core/main.ts, src/openapi/main.ts).
import { createSocket } from "node:dgram";
import { hostname } from "node:os";
import log, { LoggerJson, LoggerText, LogLevel } from "@apify/log";

const setting = (name: string) => process.env[name]?.trim() ?? "";

// RFC 5424 severity of each level of @apify/log
const SEVERITY: Record<number, number> = {
	[LogLevel.ERROR]: 3,
	[LogLevel.SOFT_FAIL]: 4,
	[LogLevel.WARNING]: 4,
	[LogLevel.INFO]: 6,
	[LogLevel.DEBUG]: 7,
	[LogLevel.PERF]: 7,
};
const USER = 1; // facility "user-level messages"
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function syslogTo(address: string) {
	const url = new URL(address);
	if (url.protocol !== "udp:")
		throw new Error(`SYSLOG_ADDRESS takes udp://host:port, not ${address}`);
	const socket = createSocket(url.hostname.includes(":") ? "udp6" : "udp4");
	socket.unref();
	const host = hostname();
	return (level: number, line: string) => {
		const priority = USER * 8 + (SEVERITY[level] ?? 6);
		const message = `<${priority}>1 ${new Date().toISOString()} ${host} p-jol-roll ${process.pid} - - ${line.replace(ANSI, "").trim()}`;
		socket.send(message, Number(url.port || 514), url.hostname);
	};
}

const json = setting("LOG_FORMAT").toLowerCase() === "json";
const Base = json ? LoggerJson : LoggerText;
const address = setting("SYSLOG_ADDRESS");
const send = address ? syslogTo(address) : null;

const logger = send
	? new (class extends Base {
			override _log(...args: Parameters<LoggerText["_log"]>) {
				const line = super._log(...args);
				send(args[0], line);
				return line;
			}
		})()
	: new Base();

const level = setting("LOG_LEVEL").toUpperCase();
log.setOptions({
	logger,
	...(level in LogLevel
		? { level: LogLevel[level as keyof typeof LogLevel] }
		: {}),
});

export default log;
