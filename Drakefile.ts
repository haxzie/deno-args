#! /usr/bin/env -S deno --allow-all

import * as path from "https://deno.land/std@v0.40.0/path/mod.ts";

import {
  desc,
  task,
  sh,
  run,
  readFile,
  glob,
} from "https://deno.land/x/drake@v0.16.0/mod.ts";

import { dirname } from "https://deno.land/x/dirname/mod.ts";

const {
  UPDATE = "false",
  SHELL,
} = Deno.env();

const __dirname = dirname(import.meta);

const shouldUpdate = UPDATE.toLowerCase() === "true";

if (!SHELL || path.basename(SHELL) !== "zsh") {
  throw `Invalid $SHELL. Expecting zsh, received ${SHELL}.`;
}

const compareFile = (a: string, b: string): boolean =>
  Deno.statSync(a).size === Deno.statSync(b).size &&
  readFile(a) === readFile(b);

desc("Sync markdown files");
task("markdown", [], async () => {
  let outdated: string[] = [];
  type UpdateFunc = (name: string, src: string, dst: string) => void;
  const update: UpdateFunc = shouldUpdate
    ? (name, src, dst) => {
      console.log(`File ${name} is out-of-date. Syncing.`);
      Deno.copyFileSync(src, dst);
    }
    : (name) => outdated.push(name);
  for (const name of glob("*.md")) {
    const src = path.join(__dirname, name);
    const dst = path.join(__dirname, "lib", name);
    if (compareFile(src, dst)) {
      console.log(`File ${name} is up-to-date. Skipping.`);
    } else {
      update(name, src, dst);
    }
  }
  if (outdated.length) {
    for (const name of outdated) {
      console.error(`File ${name} is outdated`);
    }
    throw "Some files are not up-to-date";
  }
});

desc("Fetch and compile dependencies");
task("cache", [], async () => {
  const lockWrite = shouldUpdate ? "--lock-write" : "";
  await sh(`deno cache **/*.ts --lock=deno-lock.json ${lockWrite}`);
});

desc("Run tests");
task("test", ["cache"], async () => {
  const permissions = [
    "--allow-read",
  ];
  await sh(`deno test ${permissions.join(" ")} test/**/*.test.ts`);
});

desc("Run deno fmt");
task("fmt", [], async () => {
  await sh(shouldUpdate ? "deno fmt" : "deno fmt --check");
});

desc("Run all tasks");
task("all", [
  "markdown",
  "cache",
  "test",
  "fmt",
]);

run();
