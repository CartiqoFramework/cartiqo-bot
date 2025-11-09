import chalk from "chalk";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";

type LogLevel = "info" | "warn" | "error" | "debug" | "success";

const LOG_DIR = path.resolve(process.cwd(), "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Configure allowed levels by environment
const activeLogLevels: LogLevel[] =
  process.env.NODE_ENV === "production"
    ? ["info", "warn", "error", "success"]
    : ["info", "warn", "error", "debug", "success"];

const levelConfig: Record<
  LogLevel,
  { label: string; color: typeof chalk; emoji: string }
> = {
  info: { label: "INFO", color: chalk.blue, emoji: "ℹ️" },
  warn: { label: "WARN", color: chalk.yellow, emoji: "⚠️" },
  error: { label: "ERROR", color: chalk.red, emoji: "❌" },
  debug: { label: "DEBUG", color: chalk.magenta, emoji: "🔍" },
  success: { label: "SUCCESS", color: chalk.green, emoji: "✅" },
};

function formatMessage(level: LogLevel, message: string, ...args: unknown[]) {
  const { label, color, emoji } = levelConfig[level];
  const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const argStr = args.length
    ? " " + args.map(a => JSON.stringify(a)).join(" ")
    : "";

  // For console (with colors)
  const consoleMsg = `${chalk.gray(timestamp)} ${emoji} ${color.bold(
    `[${label}]`
  )} ${message}${argStr}`;

  // For file (raw, no colors/emojis)
  const fileMsg = `${timestamp} [${label}] ${message}${argStr}`;

  return { consoleMsg, fileMsg };
}

function writeToFile(content: string) {
  const fileName = `${dayjs().format("YYYY-MM-DD")}.log`;
  const filePath = path.join(LOG_DIR, fileName);
  fs.appendFileSync(filePath, content + "\n", { encoding: "utf-8" });
}

function log(level: LogLevel, msg: string, ...args: unknown[]) {
  if (!activeLogLevels.includes(level)) return;

  const { consoleMsg, fileMsg } = formatMessage(level, msg, ...args);
  switch (level) {
    case "warn":
      console.warn(consoleMsg);
      break;
    case "error":
      console.error(consoleMsg);
      break;
    case "debug":
      console.debug(consoleMsg);
      break;
    default:
      console.log(consoleMsg);
  }
  writeToFile(fileMsg);
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
  error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
  debug: (msg: string, ...args: unknown[]) => log("debug", msg, ...args),
  success: (msg: string, ...args: unknown[]) => log("success", msg, ...args),
};
