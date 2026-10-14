'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'sw.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'OFL-Mahjong-Symbols.txt'];

// The app has no bundler: validate and copy the complete static release.
function validate() {
  const html = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(path.join(root, 'index.html')));
  assert(!html.includes('\ufffd'), 'Unexpected replacement character in HTML');
  assert.match(html, /<meta charset="utf-8">/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  new vm.Script(scripts[0][1], { filename: 'index.html' });
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  new vm.Script(worker, { filename: 'sw.js' });
  const assets = JSON.parse(worker.match(/var ASSETS = (\[[^;]+\]);/)[1].replaceAll("'", '"'));
  for (const asset of assets) {
    assert(fs.existsSync(path.join(root, asset === './' ? 'index.html' : asset)), `Missing cached asset: ${asset}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert(fs.existsSync(path.join(root, manifest.start_url)));
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(root, icon.src));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    assert(fs.existsSync(path.join(root, match[1])), `Missing HTML asset: ${match[1]}`);
  }
  const font = Buffer.from(html.match(/data:font\/woff2;base64,([^"\)]+)/)[1], 'base64');
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  for (const file of files) assert(fs.existsSync(path.join(root, file)));
  return files;
}

function build() {
  validate();
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  for (const file of files) fs.copyFileSync(path.join(root, file), path.join(root, 'dist', file));
  console.log(`Build validado: ${files.length} arquivos em dist/`);
}
if (require.main === module) build();
module.exports = { validate, build, root };
