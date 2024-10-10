import { Notebook } from "crossnote";
import path from "node:path";
import fs from "node:fs";
import { $ } from "bun";
import z from "zod";
const PCR = require("puppeteer-chromium-resolver");
const options = {};
const stats = await PCR(options);

export const ConfigSchema = z.object({
  outputPath: z.string(),
  notebookPath: z.string(),
  exported: z.array(z.string()),
});

export type ConfigSchema = z.infer<typeof ConfigSchema>;

function moveFile(filePath: string, destDirectory: string): string {
  const destFileName = path.parse(filePath).base;
  const destPath = path.resolve(destDirectory, destFileName);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.renameSync(filePath, destPath);
  return destPath;
}

export async function main(config: ConfigSchema) {
  const p = path.resolve(config.notebookPath);

  const notebook = await Notebook.init({
    notebookPath: p,
    config: {
      puppeteerArgs: [],
      chromePath: stats.executablePath,
      enableScriptExecution: true, // <= For running code chunks.
    },
  });

  for await (const fileName of config.exported) {
    const engine = notebook.getNoteMarkdownEngine(fileName);
    const filenameAndLocation = await engine.chromeExport({
      fileType: "pdf",
      runAllCodeChunks: true,
    });
    const r = moveFile(filenameAndLocation, config.outputPath);
    console.log(r);
  }
}
