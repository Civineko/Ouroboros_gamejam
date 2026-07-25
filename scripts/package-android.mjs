import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const sourcePath = path.join(
  root,
  "android/app/build/outputs/apk/debug/app-debug.apk",
);
const releaseDirectory = path.join(root, "release");
const outputPath = path.join(
  releaseDirectory,
  `QuanYiQuan-Demo-v${packageJson.version}-Android.apk`,
);

await mkdir(releaseDirectory, { recursive: true });
await copyFile(sourcePath, outputPath);

console.log(`Created ${path.relative(root, outputPath)}`);
