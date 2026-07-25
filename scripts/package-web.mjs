import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const sourceDirectory = path.join(root, "dist-offline");
const releaseDirectory = path.join(root, "release");
const outputPath = path.join(
  releaseDirectory,
  `QuanYiQuan-Demo-v${packageJson.version}-Web.zip`,
);

await mkdir(releaseDirectory, { recursive: true });
await rm(outputPath, { force: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", resolve);
  output.on("error", reject);
  archive.on("error", reject);
  archive.pipe(output);
  archive.directory(sourceDirectory, false);
  void archive.finalize();
});

console.log(`Created ${path.relative(root, outputPath)}`);
