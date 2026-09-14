import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('3D homepage keeps content accessible and geometry decorative', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.equal((html.match(/class="lantern-face"/g) || []).length, 24);
  assert.match(html, /class="lantern-scene" aria-hidden="true"/);
  assert.match(html, /id="motion-toggle" type="button" aria-pressed="false" hidden/);
  assert.match(html, /id="the-gioi"/);
  assert.match(html, /KHÔNG PHẢI GAMEPLAY/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<canvas|<iframe|style="/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
});

test('3D styles support static reduced motion and offscreen pause', async () => {
  const files = (await readdir('dist/_astro')).filter(name => name.endsWith('.css'));
  const styles = (await Promise.all(files.map(name => readFile('dist/_astro/' + name, 'utf8')))).join('\n');
  assert.match(styles, /transform-style:preserve-3d/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /data-offscreen/);
  assert.match(styles, /animation-play-state:paused/);
  assert.match(styles, /max-width:760px/);
});
