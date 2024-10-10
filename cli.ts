#!/usr/bin/env bun
import { $ } from "bun";
import { ConfigSchema, main } from ".";
import path from "node:path";
import fs from "node:fs";
import {
  binary,
  command,
  option,
  run,
  optional,
  string,
  subcommands,
} from "cmd-ts";

const configOption = option({
  long: "config",
  short: "c",
  type: optional(string),
  defaultValue: () => "exported.json",
  description: "Your config file. " + path.resolve("./README.md"),
});

const initCommand = command({
  name: "init",
  description: "Initialize the config file if it doesn't exist",
  args: {
    config: configOption,
  },
  handler: async ({ config }) => {
    const configPath = path.resolve(config!);
    if (fs.existsSync(configPath)) {
      console.log(`Config file already exists at ${configPath}`);
    } else {
      const { data } = ConfigSchema.safeParse({
        outputPath: "./public",
        notebookPath: ".",
        exported: ["README.md"],
      });
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
      console.log(`Created config file at ${configPath}`);
    }
  },
});

const generateCommand = command({
  name: "generate",
  description:
    "Create pdf from markdown files previously generated via vscode-markdown-preview-enhanced",
  args: {
    config: configOption,
  },
  handler: async ({ config }) => {
    if (!config) {
      console.log("No config file found, run 'crossnote-cli init'");
      process.exit(1);
    }

    /**
     * load config from file
     */
    const j = await $`cat ${config}`.json();
    const { success, data, error } = ConfigSchema.safeParse(j);
    if (error) {
      console.log(error);
      process.exit(1);
    }
    await main(data);
  },
});

const cli = subcommands({
  name: "create-pdf-from-markdown",
  description: "CLI tool for creating PDFs from markdown files",
  cmds: { generate: generateCommand, init: initCommand },
});

run(binary(cli), process.argv);
