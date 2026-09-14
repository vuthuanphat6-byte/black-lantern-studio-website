import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
test("production HTTP routes, contact persistence, security and restart", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "black-lantern-http-"));
  let child;
  async function launch() {
    child = spawn(process.execPath, ["server/index.mjs"], {
      cwd: resolve("."),
      env: {
        ...process.env,
        PORT: "0",
        SITE_ORIGIN: "https://blacklantern.games",
        CONTACT_DIR: dir,
        NODE_ENV: "production",
        TRUST_CLOUDFLARE: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return new Promise((ok, fail) => {
      const timeout = setTimeout(
        () => fail(new Error("startup timeout")),
        10000,
      );
      child.once("exit", (code) => {
        if (code) fail(new Error("server failed " + code));
      });
      child.stdout.on("data", (chunk) => {
        const found = chunk.toString().match(/listening on 127.0.0.1:(\d+)/);
        if (found) {
          clearTimeout(timeout);
          ok("http://127.0.0.1:" + found[1]);
        }
      });
      child.stderr.on("data", () => {});
    });
  }
  async function stop() {
    if (child && child.exitCode === null) {
      const exit = new Promise((ok) => child.once("exit", ok));
      child.kill("SIGTERM");
      await exit;
    }
  }
  const headers = {
    Origin: "https://blacklantern.games",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const value = {
    name: "Local QA",
    email: "qa@example.com",
    topic: "feedback",
    message: "Automated test payload, no external email is sent.",
  };
  try {
    let url = await launch();
    await t.test("redirects HTTP from trusted proxy to canonical HTTPS", async () => {
      const r = await fetch(url + "/tro-choi/?ref=test", { redirect: "manual", headers: {"X-Forwarded-Proto":"http"} });
      assert.equal(r.status, 308);
      assert.equal(r.headers.get("location"), "https://blacklantern.games/tro-choi/?ref=test");
      const unsafe = await fetch(url + "/%2Ftro-choi/", {redirect:"manual"});
      assert.equal(unsafe.status, 404);
    });
    await t.test("healthy site and actual 404", async () => {
      assert.equal((await fetch(url + "/")).status, 200);
      assert.equal((await fetch(url + "/missing-page/")).status, 404);
      assert.equal((await fetch(url + "/.env")).status, 404);
      const r = await fetch(url + "/tro-choi", { redirect: "manual" });
      assert.equal(r.status, 301);
      assert.equal(r.headers.get("location"), "/tro-choi/");
    });
    await t.test("production security and SEO headers", async () => {
      const r = await fetch(url + "/");
      assert.match(
        r.headers.get("content-security-policy"),
        /frame-ancestors 'none'/,
      );
      assert.equal(r.headers.get("x-content-type-options"), "nosniff");
      assert.match(
        await r.text(),
        /rel="canonical" href="https:\/\/blacklantern.games\//,
      );
      assert.equal((await fetch(url + "/sitemap-index.xml")).status, 200);
    });
    await t.test(
      "rejects cross-origin, bad method, bad content and large bodies",
      async () => {
        assert.equal((await fetch(url + "/api/contact")).status, 405);
        assert.equal(
          (
            await fetch(url + "/api/contact", {
              method: "POST",
              headers: { ...headers, Origin: "https://untrusted.example" },
              body: JSON.stringify(value),
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await fetch(url + "/api/contact", {
              method: "POST",
              headers,
              body: "not json",
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await fetch(url + "/api/contact", {
              method: "POST",
              headers,
              body: JSON.stringify({ ...value, message: "x".repeat(20000) }),
            })
          ).status,
          413,
        );
      },
    );
    await t.test("persists contact and rate limits", async () => {
      let first;
      for (let i = 0; i < 5; i++) {
        const r = await fetch(url + "/api/contact", {
          method: "POST",
          headers,
          body: JSON.stringify(value),
        });
        assert.equal(r.status, 201);
        const data = await r.json();
        first ??= data.reference;
      }
      const entries = await readdir(join(dir, "contacts"));
      assert.equal(entries.length, 5);
      const saved = JSON.parse(
        await readFile(join(dir, "contacts", first + ".json"), "utf8"),
      );
      assert.equal(saved.message, value.message);
      assert.equal(
        (
          await fetch(url + "/api/contact", {
            method: "POST",
            headers,
            body: JSON.stringify(value),
          })
        ).status,
        429,
      );
    });
    await stop();
    url = await launch();
    await t.test("rate limit survives service restart", async () => {
      assert.equal(
        (
          await fetch(url + "/api/contact", {
            method: "POST",
            headers,
            body: JSON.stringify(value),
          })
        ).status,
        429,
      );
      assert.equal((await fetch(url + "/api/health")).status, 200);
    });
  } finally {
    await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
