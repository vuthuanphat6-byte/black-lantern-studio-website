import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
const root = resolve("dist");
let failures = [];
let count = 0;
async function walk(dir) {
  let files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    files.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return files;
}
for (const file of await walk(root)) {
  if (extname(file) !== ".html") continue;
  const html = await readFile(file, "utf8");
  count++;
  for (const [label, pattern] of [
    ["title", /<title>[^<]+<\/title>/],
    ["description", /<meta name="description" content="[^"]+"/],
    ["canonical", /<link rel="canonical" href="https:\/\/blacklantern.games/],
    ["Vietnamese language", /<html lang="vi"/],
  ])
    if (!pattern.test(html)) failures.push(file + ": missing " + label);
  if ((html.match(/<h1\b/g) || []).length !== 1)
    failures.push(file + ": must have one h1");
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(match[1]);
    } catch {
      failures.push(file + ": invalid JSON-LD");
    }
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const ref = match[1].split(/[?#]/)[0];
    if (ref.startsWith("/api/")) continue;
    let dest = join(root, ref);
    try {
      if ((await stat(dest)).isDirectory()) dest = join(dest, "index.html");
      await stat(dest);
    } catch {
      failures.push(file + ": broken " + ref);
    }
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  "Verified " +
    count +
    " HTML pages: metadata, H1, structured data and local asset/navigation links.",
);
