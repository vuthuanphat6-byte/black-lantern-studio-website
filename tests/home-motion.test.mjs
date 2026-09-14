import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

async function motionHarness(reducedMotion = false) {
  const html = await readFile('dist/index.html', 'utf8');
  const code = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(script => script.includes('prefers-reduced-motion'));
  assert.ok(code, 'Built homepage enhancement is present');
  function element() {
    const properties = {};
    return {
      dataset: {}, attributes: {}, events: {}, hidden: true,
      style: { setProperty: (key, value) => { properties[key] = value; }, properties },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(key, handler) { this.events[key] = handler; },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800, bottom: 800 }),
    };
  }
  const nodes = Object.fromEntries(['.home-design', '.opening', '.lantern-scene', '[data-tilt]', '#motion-toggle'].map(key => [key, element()]));
  const reduced = { matches: reducedMotion, addEventListener(_name, fn) { this.change = fn; } };
  const fine = { matches: true, addEventListener(_name, fn) { this.change = fn; } };
  let intersection;
  const document = { hidden: false, querySelector: key => nodes[key], addEventListener() {} };
  runInNewContext(code, {
    document,
    window: { matchMedia: query => query.includes('reduced-motion') ? reduced : fine },
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} },
  });
  return { nodes, reduced, fine, intersection };
}

test('built motion controller pauses, resumes, bounds tilt and stops offscreen', async () => {
  const { nodes, intersection } = await motionHarness();
  const home = nodes['.home-design'];
  const toggle = nodes['#motion-toggle'];
  const opening = nodes['.opening'];
  const style = nodes['.lantern-scene'].style.properties;
  assert.equal(home.dataset.motion, 'active');
  assert.equal(toggle.hidden, false);
  opening.events.pointermove({ clientX: 99999, clientY: -99999 });
  assert.equal(style['--pointer-x'], '8deg');
  assert.equal(style['--pointer-y'], '5deg');
  toggle.events.click();
  assert.equal(home.dataset.motion, 'paused');
  assert.equal(toggle.attributes['aria-pressed'], 'true');
  assert.equal(style['--pointer-x'], '0deg');
  opening.events.pointermove({ clientX: 99999, clientY: -99999 });
  assert.equal(style['--pointer-x'], '0deg');
  toggle.events.click();
  assert.equal(home.dataset.motion, 'active');
  intersection([{ isIntersecting: false }]);
  assert.equal(home.dataset.offscreen, 'true');
  intersection([{ isIntersecting: true }]);
  assert.equal(home.dataset.offscreen, 'false');
});

test('system reduced motion is respected initially and when changed', async () => {
  const { nodes, reduced } = await motionHarness(true);
  assert.equal(nodes['.home-design'].dataset.motion, 'paused');
  assert.equal(nodes['#motion-toggle'].hidden, true);
  reduced.matches = false;
  reduced.change();
  assert.equal(nodes['.home-design'].dataset.motion, 'active');
  assert.equal(nodes['#motion-toggle'].hidden, false);
  reduced.matches = true;
  reduced.change();
  assert.equal(nodes['.home-design'].dataset.motion, 'paused');
});
