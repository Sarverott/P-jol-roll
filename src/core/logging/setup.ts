// Rich logging (Q1 of the devlog): every command logs through the one logger that crawlee
// uses too (@apify/log), so gathering, parsing and the hosts write the same kind of lines.
//   LOG_FORMAT=json        one JSON object per line (time, level, message and the data given)
//   LOG_LEVEL=debug        how much: error, warning, info (default), debug, verbose (= debug)
//   LOG_DIR=logs           each run also into a file of its own there (default logs/ in the
//                          repository root; "off" for none):
//                          log-<Date.now()>-<log mode>-<command>.log, e.g.
//                          log-1795390000000-info-gather.log
//   SYSLOG_ADDRESS=udp://127.0.0.1:5514   each line also to syslog, as RFC 5424 - the
//                          log-collector service of compose listens there
// Empty values (spaces count as empty) leave the defaults: text lines, info, logs/, no syslog.
// Imported first by every entry point, which then names its run: logRun("gather").
// A crash (an error nobody caught) is logged too, so it lands in the file before the exit.

import { createSocket } from "node:dgram";
import { appendFileSync, mkdirSync } from "node:fs";
import { hostname } from "node:os";
import { join, resolve } from "node:path";
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
const plain = (line: string) => line.replace(ANSI, "").trimEnd();

function syslogTo(address: string) {
	const url = new URL(address);
	if (url.protocol !== "udp:")
		throw new Error(`SYSLOG_ADDRESS takes udp://host:port, not ${address}`);
	const socket = createSocket(url.hostname.includes(":") ? "udp6" : "udp4");
	socket.unref();
	const host = hostname();
	return (level: number, line: string) => {
		const priority = USER * 8 + (SEVERITY[level] ?? 6);
		const message = `<${priority}>1 ${new Date().toISOString()} ${host} p-jol-roll ${process.pid} - - ${plain(line).trim()}`;
		socket.send(message, Number(url.port || 514), url.hostname);
	};
}

// the log mode of the run: the level asked for, as it is named in the file
const MODES: Record<string, keyof typeof LogLevel> = {
	error: "ERROR",
	warn: "WARNING",
	warning: "WARNING",
	info: "INFO",
	debug: "DEBUG",
	verbose: "DEBUG",
	perf: "PERF",
};
const mode = setting("LOG_LEVEL").toLowerCase() || "info";
const level = MODES[mode];

const json = setting("LOG_FORMAT").toLowerCase() === "json";
const Base = json ? LoggerJson : LoggerText;
const address = setting("SYSLOG_ADDRESS");
const send = address ? syslogTo(address) : null;
let file = "";

class Tee extends Base {
	override _log(...args: Parameters<LoggerText["_log"]>) {
		const line = super._log(...args);
		if (file) appendFileSync(file, `${plain(line)}\n`);
		send?.(args[0], line);
		return line;
	}
}

log.setOptions({
	logger: new Tee(),
	...(level ? { level: LogLevel[level] } : {}),
});

// the file of this run, from now on: logs/log-<Date.now()>-<mode>-<name>.log
export function logRun(name: string) {
	const dir = setting("LOG_DIR") || "logs";
	if (dir.toLowerCase() === "off") return "";
	mkdirSync(dir, { recursive: true });
	const safe = name.replace(/[^A-Za-z0-9_.-]+/g, "-") || "run";
	file = resolve(
		join(dir, `log-${Date.now()}-${level ? mode : "info"}-${safe}.log`),
	);
	log.debug(`log file: ${file}`);
	return file;
}

for (const event of ["uncaughtException", "unhandledRejection"] as const)
	process.on(event, (error) => {
		log.exception(error as Error, `crashed (${event})`);
		process.exit(1);
	});

export default log;
