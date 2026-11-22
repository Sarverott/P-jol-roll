import { defineConfig } from "vitest/config";

// tests read the English of the terminal, whatever LANG the machine has (src/i18n/terminal.ts)
export default defineConfig({ test: { env: { P_JOL_ROLL_LANG: "EN-US" } } });
