import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);

function run(command, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: isWindows,
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}

const npm = isWindows ? "npm.cmd" : "npm";
const npx = isWindows ? "npx.cmd" : "npx";
const gradle = isWindows ? "gradlew.bat" : "./gradlew";

await run(npm, ["run", "build"]);
await run(npx, ["cap", "sync", "android"]);
await run(gradle, ["assembleDebug"], path.join(root, "android"));

const source = path.join(
  root,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk",
);
const outputDirectory = path.join(root, "release", "android");
const destination = path.join(
  outputDirectory,
  `Ouroboros-${packageJson.version}-debug.apk`,
);

await mkdir(outputDirectory, { recursive: true });
await copyFile(source, destination);
console.log(`Android package: ${destination}`);
