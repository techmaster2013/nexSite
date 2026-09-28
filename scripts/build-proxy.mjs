import { mkdir, cp, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = join(root, "node_modules");

async function findFile(dir, name) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      try {
        const f = await findFile(p, name);
        if (f) return f;
      } catch {}
    } else if (ent.name === name) {
      return p;
    }
  }
}

async function copyNamed(pkgDir, outDir, names) {
  await mkdir(outDir, { recursive: true });
  for (const name of names) {
    const src = await findFile(pkgDir, name);
    if (!src) throw new Error("Could not find " + name + " in " + pkgDir);
    await cp(src, join(outDir, name));
  }
}

await copyNamed(join(nm, "@mercuryworkshop/scramjet"), join(root, "scramjet"), [
  "scramjet.js",
  "scramjet.wasm"
]);

await copyNamed(join(nm, "@mercuryworkshop/scramjet-controller"), join(root, "controller"), [
  "controller.api.js",
  "controller.inject.js",
  "controller.sw.js"
]);

await copyNamed(join(nm, "@mercuryworkshop/libcurl-transport"), join(root, "libcurl"), [
  "index.mjs"
]);

await cp(join(root, "scripts", "scramjet-sw.js"), join(root, "sw.js"));

console.log("nexSite Scramjet assets built.");
