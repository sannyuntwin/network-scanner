import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

function cleanDir(relativePath) {
  try {
    rmSync(relativePath, { recursive: true, force: true });
    console.log(`[dev-clean] removed ${relativePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[dev-clean] failed to remove ${relativePath}: ${message}`);
  }
}

cleanDir(".next");
cleanDir(path.join("node_modules", ".cache"));

const nextCliPath = path.join("node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextCliPath, "dev", "-p", "3000"], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[dev-clean] failed to start Next.js dev server: ${message}`);
  process.exit(1);
});
