import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage identifies Cyno consistently in copy, SEO and structured data', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /Black Lantern Studio \| Studio game Việt Nam thuộc Cyno/);
  assert.match(html, /MỘT NHÁNH CỦA CYNO/);
  assert.match(html, /Chất Việt trong cách chúng tôi kể chuyện/);
  assert.match(html, /href="https:\/\/cyno.com.vn"/);
  const entities = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const studio = entities.find(item => item['@type'] === 'Organization');
  assert.equal(studio.parentOrganization.name, 'Cyno');
  assert.equal(studio.parentOrganization.url, 'https://cyno.com.vn');
  assert.match(html, /name="google-site-verification"/);
});

test('brand pages and press factsheet no longer describe an independent studio', async () => {
  for (const path of ['index.html', 've-studio/index.html', 'bao-chi/index.html', 'lien-he/index.html', 'tro-choi/index.html', 'tin-tuc/black-lantern-studio/index.html', 'downloads/black-lantern-factsheet.txt']) {
    const content = await readFile('dist/' + path, 'utf8');
    assert.match(content, /Cyno|CYNO/, path);
    assert.doesNotMatch(content, /studio game độc lập|studio độc lập|STUDIO ĐỘC LẬP/i, path);
  }
});
