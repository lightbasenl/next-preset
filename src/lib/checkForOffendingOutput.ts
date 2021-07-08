import * as acorn from "acorn";
import glob from "glob";
import { promises as fs } from "fs";
import { SourceMapConsumer } from "source-map";
import _ from "lodash";

export default async function checkForOffendingOutput(
  ignoreModules: string[] = []
) {
  const ecmaVersion = 5;
  const paths = ["./.next/static/**/*.js"];
  const useEsModules = false;
  const allowHashBang = false;

  const errors: { file: string; error: Error & { loc: acorn.Position } }[] = [];
  const files: string[] = [];
  const offenders: string[] = [];
  const globOptions: glob.IOptions = { nodir: true };
  const acornOptions: acorn.Options = { ecmaVersion };

  if (useEsModules) {
    acornOptions.sourceType = "module";
  }

  if (allowHashBang) {
    acornOptions.allowHashBang = true;
  }

  // Discover files
  paths.forEach((pattern) => {
    const paths = glob.sync(pattern, globOptions);
    files.push(...paths);
  });

  if (files.length === 0) {
    return;
  }

  console.log(`[PRESET] Checking browser compatibility...`);

  await Promise.all(
    files.map(async (file) => {
      const code = await fs.readFile(file, "utf-8");

      try {
        acorn.parse(code, acornOptions);
      } catch (error) {
        errors.push({ file, error });
      }
    })
  );

  if (errors.length === 0) {
    return;
  }

  // Process source maps
  await Promise.all(
    errors.map(async ({ file, error }) => {
      try {
        const contents = await fs.readFile(`${file}.map`, "utf-8");

        const data = JSON.parse(contents);

        const sourceMap = await new SourceMapConsumer(data);

        const originalPosition = sourceMap.originalPositionFor({
          line: error.loc.line,
          column: error.loc.column,
        });

        if (
          !originalPosition.source ||
          offenders.includes(originalPosition.source)
        ) {
          return;
        }

        offenders.push(originalPosition.source);
      } catch (error) {
        console.log();
        console.log("[PRESET]");
        console.log(
          `${_.uniqBy(errors, (error) => error.file).length} offending ${
            errors.length === 1 ? "file" : "files"
          } found.`
        );
        console.log();
        console.error(
          "Please run `next build` with `productionBrowserSourceMaps: true` in `next.config.js` to find offending dependencies."
        );
        console.log();

        process.exit(1);
      }
    })
  );

  const filteredOffenders = _.uniq(
    offenders.map((offender) => formatEntry(offender))
  ).filter((offender) => !ignoreModules.includes(offender));

  if (filteredOffenders.length === 0) {
    return;
  }

  console.log("[PRESET]");
  console.log(
    "You might want to add the following entries to `preset.transpileModules` in `next.config.js`:"
  );
  console.log();

  for (const offender of filteredOffenders) {
    console.log(`- ${offender}`);
  }

  console.log();
  console.log(
    `For more information, see: https://github.com/martpie/next-transpile-modules`
  );
  console.log();

  process.exit(1);
}

function formatEntry(entry: string) {
  return entry
    .replace("webpack://_N_E/", "")
    .split("/")
    .reduce<string[]>((parts, part, index) => {
      if (parts.length === 0 && part === "node_modules" && index === 0) {
        return parts;
      }

      if (parts[parts.length - 1] === "node_modules") {
        parts.push(part);
        return parts;
      }

      if (parts[parts.length - 1] && parts[parts.length - 1].startsWith("@")) {
        parts.push(part);
        return parts;
      }

      if (parts.length === 0) {
        parts.push(part);
        return parts;
      }

      if (part === "node_modules") {
        parts.push(part);
        return parts;
      }

      return parts;
    }, [])
    .join("/");
}
