import glob from "glob";
import { promises as fs } from "fs";

export default async function removeSourceMaps() {
  const paths = ["./.next/static/**/*.js.map"];

  const files: string[] = [];
  const globOptions: glob.IOptions = { nodir: true };

  // Discover files
  paths.forEach((pattern) => {
    const paths = glob.sync(pattern, globOptions);
    files.push(...paths);
  });

  if (files.length === 0) {
    return;
  }

  console.log(`[PRESET] Cleaning up sourcemaps...`);

  await Promise.all(files.map((file) => fs.unlink(file)));
}
