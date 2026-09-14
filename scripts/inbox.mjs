import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
const dir = resolve(process.env.CONTACT_DIR || "/var/lib/black-lantern");
const id = process.argv[2];
const valid =
  /^BL-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
if (id && !valid.test(id)) throw new Error("Expected a BL-UUID reference");
if (id) {
  const data = JSON.parse(
    await readFile(join(dir, "contacts", id + ".json"), "utf8"),
  );
  console.log(JSON.stringify(data, null, 2));
} else {
  const names = (await readdir(join(dir, "contacts"))).filter(
    (n) => n.endsWith(".json") && valid.test(n.slice(0, -5)),
  );
  const rows = [];
  for (const name of names) {
    const data = JSON.parse(
      await readFile(join(dir, "contacts", name), "utf8"),
    );
    rows.push({
      reference: data.reference,
      createdAt: data.createdAt,
      topic: data.topic,
    });
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  console.log(JSON.stringify(rows, null, 2));
}
