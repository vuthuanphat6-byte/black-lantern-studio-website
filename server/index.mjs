import http from "node:http";
import {
  readFile,
  stat,
  readdir,
  mkdir,
  writeFile,
  unlink,
  open,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve, join, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { validateContact } from "./validation.mjs";
const root = resolve(
  process.env.STATIC_DIR || fileURLToPath(new URL("../dist", import.meta.url)),
);
const dataDir = resolve(
  process.env.CONTACT_DIR ||
    fileURLToPath(new URL("../.local-data", import.meta.url)),
);
const origin = process.env.SITE_ORIGIN || "http://127.0.0.1:4321";
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || "127.0.0.1";
const contactDir = join(dataDir, "contacts"),
  rateDir = join(dataDir, "rate");
await mkdir(contactDir, { recursive: true, mode: 0o700 });
await mkdir(rateDir, { recursive: true, mode: 0o700 });
let salt;
try {
  salt = await readFile(join(dataDir, "rate-salt"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  salt = randomBytes(32);
  await writeFile(join(dataDir, "rate-salt"), salt, {
    flag: "wx",
    mode: 0o600,
  });
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
};
const cache = new Map();
function baseHeaders(res) {
  if (!isProduction) res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  if (isProduction)
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
}
function json(res, status, value, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    ...extra,
  });
  res.end(JSON.stringify(value));
}
function htmlResponse(res, status, message) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    "Content-Security-Policy":
      "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  });
  res.end(
    '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Liên hệ — Black Lantern Studio</title><h1>' +
      message +
      '</h1><p><a href="/lien-he/">Trở về trang liên hệ</a></p></html>',
  );
}
async function getBody(req) {
  let size = 0;
  const parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw Object.assign(new Error("size"), { status: 413 });
    parts.push(chunk);
  }
  return Buffer.concat(parts).toString("utf8");
}
let queue = Promise.resolve();
async function serialize(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}
async function prune() {
  const now = Date.now();
  for (const [dir, age] of [
    [contactDir, 30 * 86400000],
    [rateDir, 3600000],
  ]) {
    for (const name of await readdir(dir)) {
      if (!/^[a-zA-Z0-9-]+\.json$/.test(name)) continue;
      const path = join(dir, name);
      const info = await stat(path);
      if (now - info.mtimeMs > age) await unlink(path);
    }
  }
}
await prune();
const timer = setInterval(
  () => serialize(prune).catch(() => console.error("retention_cleanup_failed")),
  3600000,
);
timer.unref();
async function storeContact(value, ip) {
  return serialize(async () => {
    const now = Date.now(),
      key = createHmac("sha256", salt).update(ip).digest("hex"),
      ratePath = join(rateDir, key + ".json");
    let times = [];
    try {
      times = JSON.parse(await readFile(ratePath, "utf8")).filter(
        (time) => now - time < 3600000,
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (times.length >= 5)
      return {
        status: 429,
        message:
          "Bạn đã gửi nhiều lời nhắn. Vui lòng thử lại sau hoặc liên hệ email trực tiếp.",
      };
    if ((await readdir(contactDir)).length >= 10000)
      return {
        status: 503,
        message: "Hộp thư tạm thời bận. Vui lòng liên hệ qua email.",
      };
    const reference = "BL-" + randomUUID(),
      path = join(contactDir, reference + ".json");
    const file = await open(path, "wx", 0o600);
    try {
      await file.writeFile(
        JSON.stringify(
          { reference, createdAt: new Date(now).toISOString(), ...value },
          null,
          2,
        ),
      );
      await file.sync();
    } finally {
      await file.close();
    }
    await writeFile(ratePath, JSON.stringify([...times, now]), { mode: 0o600 });
    return { status: 201, reference };
  });
}
const server = http.createServer(async (req, res) => {
  baseHeaders(res);
  try {
    const url = new URL(req.url, "http://localhost");
    const peerAddress = req.socket.remoteAddress || "";
    const trustedProxy = process.env.TRUST_CLOUDFLARE === "1" &&
      ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peerAddress);
    if (isProduction && trustedProxy && req.headers["x-forwarded-proto"] === "http") {
      res.writeHead(308, { Location: origin + url.pathname + url.search, "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/api/health") {
      if (req.method !== "GET" && req.method !== "HEAD")
        return json(res, 405, { ok: false });
      await stat(join(root, "index.html"));
      return json(res, 200, { ok: true, service: "black-lantern-studio" });
    }
    if (url.pathname === "/api/contact") {
      if (req.method !== "POST")
        return json(
          res,
          405,
          { message: "Phương thức không được hỗ trợ." },
          { Allow: "POST" },
        );
      if (req.headers.origin !== origin)
        return json(res, 403, { message: "Nguồn gửi không được chấp nhận." });
      const type = (req.headers["content-type"] || "").split(";")[0];
      if (
        !["application/x-www-form-urlencoded", "application/json"].includes(
          type,
        )
      )
        return json(res, 415, { message: "Định dạng dữ liệu không hợp lệ." });
      if (Number(req.headers["content-length"] || 0) > 16384)
        return json(res, 413, { message: "Nội dung gửi quá lớn." });
      const raw = await getBody(req);
      let input;
      try {
        input =
          type === "application/json"
            ? JSON.parse(raw)
            : Object.fromEntries(new URLSearchParams(raw));
      } catch {
        return json(res, 400, { message: "Dữ liệu gửi không hợp lệ." });
      }
      const result = validateContact(input);
      if (result.error) return json(res, 400, { message: result.error });
      const peer = req.socket.remoteAddress || "";
      const forwarded =
        process.env.TRUST_CLOUDFLARE === "1" &&
        ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peer)
          ? req.headers["cf-connecting-ip"]
          : null;
      const ip =
        typeof forwarded === "string" && /^[0-9a-fA-F:.]{3,64}$/.test(forwarded)
          ? forwarded
          : peer;
      const stored = await storeContact(result.value, ip);
      if (stored.status !== 201)
        return json(
          res,
          stored.status,
          { message: stored.message },
          stored.status === 429 ? { "Retry-After": "3600" } : {},
        );
      console.log("contact_received " + stored.reference);
      if ((req.headers.accept || "").includes("application/json"))
        return json(res, 201, { reference: stored.reference });
      return htmlResponse(
        res,
        201,
        "Lời nhắn đã được tiếp nhận. Mã: " + stored.reference,
      );
    }
    if (req.method !== "GET" && req.method !== "HEAD")
      return json(
        res,
        405,
        { message: "Phương thức không được hỗ trợ." },
        { Allow: "GET, HEAD" },
      );
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return json(res, 400, { message: "Đường dẫn không hợp lệ." });
    }
    if (
      pathname.startsWith("//") ||
      pathname.includes("\0") ||
      pathname.includes("\\") ||
      pathname.split("/").some((part) => part.startsWith("."))
    )
      return json(res, 404, { message: "Không tìm thấy." });
    let path = resolve(root, "." + pathname);
    if (path !== root && !path.startsWith(root + sep))
      return json(res, 404, { message: "Không tìm thấy." });
    let info;
    try {
      info = await stat(path);
    } catch {}
    if (info?.isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, {
          Location: pathname + "/" + url.search,
          "Cache-Control": "public,max-age=3600",
        });
        return res.end();
      }
      path = join(path, "index.html");
      try {
        info = await stat(path);
      } catch {
        info = null;
      }
    }
    let status = 200;
    if (!info?.isFile() || !mime[extname(path)]) {
      status = 404;
      path = join(root, "404.html");
      try {
        info = await stat(path);
      } catch {
        return json(res, 404, { message: "Không tìm thấy." });
      }
    }
    const type = mime[extname(path)];
    res.setHeader("Content-Type", type);
    if (status === 404) res.setHeader("X-Robots-Tag", "noindex");
    if (type.startsWith("text/html")) {
      let item = cache.get(path);
      if (!item) {
        const content = await readFile(path);
        const hashes = [
          ...content
            .toString()
            .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
        ]
          .filter((m) => m[1].trim())
          .map(
            (m) =>
              "'sha256-" +
              createHash("sha256").update(m[1]).digest("base64") +
              "'",
          );
        item = {
          content,
          csp:
            "default-src 'self'; script-src 'self' " +
            hashes.join(" ") +
            "; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
        };
        cache.set(path, item);
      }
      res.setHeader("Content-Security-Policy", item.csp);
      // Keep HTML byte-exact: CSP hashes and privacy exclude proxy-injected analytics.
      res.setHeader("Cache-Control", "public,max-age=0,must-revalidate,no-transform");
      res.setHeader("Content-Length", item.content.length);
      res.writeHead(status);
      return res.end(req.method === "HEAD" ? undefined : item.content);
    }
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    res.setHeader(
      "Cache-Control",
      pathname.startsWith("/_astro/")
        ? "public,max-age=31536000,immutable"
        : "public,max-age=3600",
    );
    res.setHeader("Content-Length", info.size);
    res.writeHead(status);
    if (req.method === "HEAD") return res.end();
    createReadStream(path)
      .on("error", () => res.destroy())
      .pipe(res);
  } catch (error) {
    console.error(
      error.status === 413 ? "request_too_large" : "request_failed",
    );
    if (!res.headersSent)
      json(res, error.status || 500, {
        message:
          error.status === 413
            ? "Nội dung gửi quá lớn."
            : "Chưa thể xử lý yêu cầu. Vui lòng thử lại hoặc gửi email trực tiếp.",
      });
    else res.destroy();
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.maxConnections = 100;
server.listen(port, host, () =>
  console.log(
    "Black Lantern listening on " + host + ":" + server.address().port,
  ),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    clearInterval(timer);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
