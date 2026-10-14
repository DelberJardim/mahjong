'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { root } = require('../scripts/build.cjs');
let browser, server, url;
const errors = [];
const results = path.join(root, 'test-results');

before(async () => {
  fs.mkdirSync(results, { recursive: true });
  server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json', '.png': 'image/png' }[path.extname(file)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true,
    ...(process.env.MAHJONG_BROWSER_CHANNEL ? { channel: process.env.MAHJONG_BROWSER_CHANNEL } : {}) });
});

after(async () => {
  await browser?.close();
  await new Promise(resolve => server?.close(resolve));
});

async function open(viewport = { width: 1280, height: 900 }, address = url) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.__expectedFaceHTML = face => {
      const span = document.createElement('span');
      span.innerHTML = window.__mahjong.renderFace(face);
      return span.innerHTML;
    };
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(address);
  await page.evaluate(() => document.fonts.ready);
  return { page, context };
}

// A contact sheet puts every face in view, including faces normally hidden by upper layers.
async function atlas(page, theme, blocked = false) {
  return page.evaluate(async ({ theme, blocked }) => {
    const api = window.__mahjong;
    document.querySelector('#atlas')?.remove();
    const container = document.createElement('div');
    container.id = 'atlas';
    container.style.cssText = 'position:fixed;inset:0;z-index:200000;background:#14532d;display:grid;' +
      'grid-template-columns:repeat(auto-fit,minmax(65px,1fr));gap:5px;padding:8px;overflow:auto;align-content:start';
    for (const face of api.THEMES[theme].faces) {
      const tile = document.createElement('div');
      tile.className = 'tile' + (blocked ? ' blocked' : '');
      tile.dataset.face = face;
      tile.style.cssText = 'position:relative;width:65px;height:86px';
      tile.innerHTML = '<span class="face" style="font-size:39px">' + api.renderFace(face) + '</span>';
      container.appendChild(tile);
    }
    document.body.appendChild(container);
    await document.fonts.ready;
    return api.THEMES[theme].faces;
  }, { theme, blocked });
}

test('as 42 faces clássicas têm glifos, cores legíveis e estilos completos no desktop e celular', async () => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const { page, context } = await open(viewport);
    const faces = await atlas(page, 'classico');
    assert.equal(faces.length, 42);
    assert.equal(new Set(faces).size, 42);
    const checks = await page.evaluate(() => [...document.querySelectorAll('#atlas .face')].map(el => {
      const child = el.firstElementChild;
      const rect = child.getBoundingClientRect(), faceRect = el.getBoundingClientRect();
      const chars = [...el.querySelectorAll('.classic-char,.value,.suit')].map(span => ({
        text: span.textContent, color: getComputedStyle(span).color,
        font: getComputedStyle(span).fontFamily, size: parseFloat(getComputedStyle(span).fontSize),
        loaded: document.fonts.check('700 40px "Mahjong Symbols"', span.textContent)
      }));
      return { code: el.parentElement.dataset.face, chars,
        visible: rect.width > 0 && rect.height > 0 && rect.width <= faceRect.width && rect.height <= faceRect.height,
        malformed: [...el.querySelectorAll('*')].some(node => [...node.attributes].some(attr => /noto|cjk|serif;/.test(attr.name))),
        svgShapes: el.querySelectorAll('circle,rect').length };
    }));
    for (const check of checks) {
      assert(check.visible, `Invalid bounds: ${check.code}`);
      assert(!check.malformed, `Broken HTML attributes: ${check.code}`);
      assert(check.chars.length || check.svgShapes, `Empty face: ${check.code}`);
      for (const char of check.chars) {
        assert(char.text && !char.text.includes('undefined'));
        assert(char.loaded && char.font.includes('Mahjong Symbols'), `Missing embedded glyph: ${check.code}`);
        assert(char.size > 10);
        assert(['rgb(31, 95, 168)', 'rgb(200, 57, 47)', 'rgb(28, 122, 74)', 'rgb(35, 33, 28)'].includes(char.color),
          `Unreadable color: ${check.code} ${char.color}`);
      }
    }
    await page.screenshot({ path: path.join(results, `classic-${viewport.width}.png`) });
    await atlas(page, 'classico', true);
    await page.screenshot({ path: path.join(results, `classic-blocked-${viewport.width}.png`) });
    await context.close();
  }
});

test('todos os outros temas têm 36 faces visíveis e diferentes', async () => {
  const { page, context } = await open();
  for (const theme of ['bichos', 'natureza', 'numeros']) {
    const faces = await atlas(page, theme);
    assert.equal(faces.length, 36);
    assert.equal(new Set(faces).size, 36);
    assert.equal(await page.locator('#atlas .face').count(), 36);
    assert(await page.locator('#atlas').evaluate(el => [...el.children].every(tile =>
      tile.textContent.trim() && tile.getBoundingClientRect().width > 0)));
    await page.screenshot({ path: path.join(results, `${theme}.png`) });
  }
  await context.close();
});

test('todos os layouts e temas mantêm geometria, pares, categorias e renderização', async () => {
  const { page, context } = await open({ width: 390, height: 844 });
  const checks = await page.evaluate(() => {
    const api = window.__mahjong;
    const output = [];
    for (const theme of Object.keys(api.THEMES)) {
      for (const layout of Object.keys(api.LAYOUTS)) {
        api.newGame(layout, theme);
        const g = api.G, counts = {};
        for (const tile of g.tiles) counts[tile.face] = (counts[tile.face] || 0) + 1;
        const board = document.querySelector('#board').getBoundingClientRect();
        const viewport = document.querySelector('#viewport').getBoundingClientRect();
        output.push({ theme, layout, total: g.tiles.length, expected: api.LAYOUTS[layout].tiles,
          counts: Object.values(counts), kinds: [...new Set(g.tiles.map(t => t.face[0]))].sort().join(''),
          valid: g.tiles.every(t => api.THEMES[theme].faces.includes(t.face) && t.el.querySelector('.face').innerHTML === window.__expectedFaceHTML(t.face)),
          fits: board.left >= viewport.left - 1 && board.top >= viewport.top - 1 &&
            board.right <= viewport.right + 1 && board.bottom <= viewport.bottom + 1,
          moves: api.availableMoves(api.aliveMask()).length });
      }
    }
    return output;
  });
  assert.equal(checks.length, 16);
  for (const check of checks) {
    assert.equal(check.total, check.expected);
    assert(check.counts.every(count => count % 2 === 0));
    assert(check.valid && check.fits && check.moves > 0, JSON.stringify(check));
    if (check.theme === 'classico') assert.equal(check.kinds, 'BCDFPSW');
  }
  await page.screenshot({ path: path.join(results, 'board-mobile.png') });
  await context.close();
});

test('trocar temas preserva exatamente os pares, a partida e todos os desenhos', async () => {
  const { page, context } = await open();
  await page.evaluate(() => window.__mahjong.newGame('classico', 'classico'));
  const original = await page.evaluate(() => window.__mahjong.G.tiles.map(t => t.face));
  await page.locator('#btnMenu').click();
  for (const label of ['Números', 'Frutas e bichos', 'Natureza', 'Clássico chinês']) {
    await page.locator('#optTheme .opt').filter({ hasText: label }).click();
    const current = await page.evaluate(() => {
      const api = window.__mahjong;
      return { faces: api.G.tiles.map(t => t.face), removed: api.G.tiles.filter(t => t.removed).length,
        history: api.G.history.length,
        valid: api.G.tiles.every(t => t.el.querySelector('.face').innerHTML === window.__expectedFaceHTML(t.face)) };
    });
    assert.equal(current.removed, 0);
    assert.equal(current.history, 0);
    assert(current.valid);
    for (let i = 0; i < original.length; i++) for (let j = 0; j < original.length; j++) {
      assert.equal(current.faces[i] === current.faces[j], original[i] === original[j], `${label}: pair ${i},${j}`);
    }
  }
  await page.locator('#btnCloseMenu').click();
  await page.reload();
  assert.equal(await page.evaluate(() => window.__mahjong.G.theme), 'classico');
  await context.close();
});

test('selecionar/remover, desfazer, dica, embaralhar e zoom continuam funcionando', async () => {
  const { page, context } = await open();
  await page.evaluate(() => window.__mahjong.newGame('facil', 'classico'));
  const pair = await page.evaluate(() => window.__mahjong.availableMoves(window.__mahjong.aliveMask())[0]);
  for (const id of pair) await page.locator(`.tile[data-id="${id}"]`).click();
  assert.equal(await page.locator('#stLeft').textContent(), '34');
  await page.locator('#btnUndo').click();
  assert.equal(await page.locator('#stLeft').textContent(), '36');
  const before = await page.evaluate(() => window.__mahjong.G.tiles.map(t => t.face).sort());
  await page.locator('#btnShuffle').click();
  const shuffled = await page.evaluate(() => {
    const api = window.__mahjong;
    return { faces: api.G.tiles.map(t => t.face).sort(), valid: api.G.tiles.every(t =>
      t.el.querySelector('.face').innerHTML === window.__expectedFaceHTML(t.face)) };
  });
  assert.deepEqual(shuffled.faces, before);
  assert(shuffled.valid);
  await page.locator('#btnHint').click();
  assert.equal(await page.locator('.tile.hint').count(), 2);
  const transform = await page.locator('#board').evaluate(el => el.style.transform);
  await page.locator('#btnZoom').click();
  assert.notEqual(await page.locator('#board').evaluate(el => el.style.transform), transform);
  await context.close();
});

test('partidas antigas restauram ventos, dragões, caracteres e F1/F2 com o mesmo significado', async () => {
  const { page, context } = await open();
  const legacy = ['P1', 'B1', 'C9', 'WE', 'WS', 'WW', 'WN', 'DR', 'DG', 'DW', 'F1', 'F2'];
  const saved = Array.from({ length: 72 }, (_, i) => legacy[Math.floor(i / 2) % legacy.length]);
  await context.addInitScript(faces => localStorage.setItem('mahjong-mamae-v1', JSON.stringify({
    layout: 'medio', theme: 'classico', faces, removed: Array(72).fill(0), history: [], moves: 0, elapsed: 123000
  })), saved);
  await page.reload();
  const restored = await page.evaluate(() => ({ faces: window.__mahjong.G.tiles.map(t => t.face),
    time: window.__mahjong.G.baseTime,
    flowers: window.__mahjong.G.tiles.filter(t => /^F/.test(t.face)).map(t => [t.face, t.el.textContent]) }));
  assert.deepEqual(restored.faces, saved);
  assert.equal(restored.time, 123000);
  assert(restored.flowers.every(([code, char]) => char === (code === 'F1' ? '梅' : '竹')));
  await context.close();
});

test('o index.html sozinho carrega a fonte e todas as faces sem rede', async () => {
  const { page, context } = await open(undefined, pathToFileURL(path.join(root, 'index.html')).href);
  await context.setOffline(true);
  await atlas(page, 'classico');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.classic-char,.value,.suit')]
    .every(el => document.fonts.check('700 40px "Mahjong Symbols"', el.textContent))), true);
  await context.close();
});

test('atualização do PWA substitui cache v1, preserva caches alheios e funciona offline', async () => {
  const context = await browser.newContext();
  await context.route('**/sw.js', route => route.fulfill({ contentType: 'text/javascript', body: `
    self.addEventListener('install', e => e.waitUntil(caches.open('mahjong-mamae-v1').then(c =>
      c.put('./index.html', new Response('<html><body>VERSAO_ANTIGA</body></html>', {headers:{'Content-Type':'text/html'}}))).then(() => self.skipWaiting())));
    self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', e => { if(e.request.mode === 'navigate') e.respondWith(caches.match('./index.html')); });
  ` }));
  const page = await context.newPage();
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.evaluate(() => caches.open('outro-aplicativo'));
  await context.unroute('**/sw.js');
  await page.evaluate(async () => {
    const changed = new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    await (await navigator.serviceWorker.getRegistration()).update();
    await changed;
  });
  await page.waitForFunction(async () => (await caches.keys()).includes('mahjong-mamae-v2') &&
    !(await caches.keys()).includes('mahjong-mamae-v1'));
  await page.reload();
  assert.equal(await page.evaluate(() => !!window.__mahjong), true);
  assert(await page.evaluate(async () => (await caches.keys()).includes('outro-aplicativo')));
  await context.setOffline(true);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await atlas(page, 'classico');
  assert.equal(await page.locator('#atlas .tile').count(), 42);
  assert(await page.evaluate(() => document.fonts.check('700 40px "Mahjong Symbols"', '發蘭菊春夏秋冬')));
  await context.close();
});

test('nenhum erro JavaScript durante a validação', () => {
  assert.deepEqual(errors, []);
});
