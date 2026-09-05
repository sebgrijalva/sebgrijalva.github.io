import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const cwd = fileURLToPath(new URL("../../", import.meta.url));
const run = (...args) =>
  execFileSync(process.execPath, args, { cwd, stdio: "inherit" });
run("zero-is-you/tools/prepare-v8.mjs");
run("tools/repair-zero-builder.mjs");
run("tools/finalize-zero-v11.mjs");
for (const file of [
  "game-v12.js",
  "feedback.js",
  "game-v9.js",
  "music-v10.js",
  "constraints-v11.js",
  "engine-v11.js",
  "levels-v11-runtime.js",
])
  run("--check", "zero-is-you/" + file);
for (const version of [7, 8, 9, 10, 11])
  run("zero-is-you/tests/v" + version + ".mjs");
