'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validate, build, root } = require('../scripts/build.cjs');

test('UTF-8, JavaScript, fonte embutida e todos os caminhos dos assets são válidos', () => {
  assert.equal(validate().length, 6);
});

test('build mantém o jogo standalone e copia todos os arquivos sem alterações', () => {
  build();
  for (const file of validate()) {
    assert.deepEqual(fs.readFileSync(path.join(root, 'dist', file)), fs.readFileSync(path.join(root, file)));
  }
});
