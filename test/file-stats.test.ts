import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import url from 'node:url';
import path from 'node:path';
import { fileStats } from '../src/file-stats.ts';

describe('file-stats', () => {
  const testFilesDir = `${path.dirname(url.fileURLToPath(import.meta.url))}/files`;

  test('return file stats', async () => {
    const stats = await fileStats({
      cwd: testFilesDir,
      fileMatch: [
        'sample.tmx',
      ],
    });

    assert.deepEqual(stats['sample.tmx'].header, {
      creationtool: 'Test Tool',
      creationtoolversion: '1.0',
      segtype: 'sentence',
      'o-tmf': 'tmx',
      adminlang: 'en-US',
      srclang: 'en-US',
      datatype: 'plaintext',
    });

    assert.deepEqual(stats['sample.tmx'].body, {
      tu: {
        count: 4,
        tuv: {
          'en-US': {
            count: 4,
          },
          'es-ES': {
            count: 4,
          },
          'fr-FR': {
            count: 4,
          },
        },
      },
    });

    assert.equal((stats['sample.tmx'].size > 0), true);
  });

  test('handle file with empty body', async () => {
    const stats = await fileStats({
      cwd: testFilesDir,
      fileMatch: 'empty-body.tmx',
    });

    assert.equal(stats['empty-body.tmx'].body.tu.count, 0);
    assert.deepEqual(stats['empty-body.tmx'].body.tu.tuv, {});
    assert.ok(stats['empty-body.tmx'].size > 0);
  });

  test('handle file with single language', async () => {
    const stats = await fileStats({
      cwd: testFilesDir,
      fileMatch: 'single-language.tmx',
    });

    assert.equal(stats['single-language.tmx'].body.tu.count, 2);
    assert.deepEqual(stats['single-language.tmx'].body.tu.tuv, {
      'en-US': {
        count: 2,
      },
    });
  });

  test('handle file with mixed languages across TUs', async () => {
    const mixedFile = 'mixed-languages.tmx';
    const stats = await fileStats({
      cwd: testFilesDir,
      fileMatch: mixedFile,
    });

    assert.equal(stats[mixedFile].body.tu.count, 2);
    assert.equal(stats[mixedFile].body.tu.tuv['en-US'].count, 2);
    assert.equal(stats[mixedFile].body.tu.tuv['fr-FR'].count, 1);
    assert.equal(stats[mixedFile].body.tu.tuv['de-DE'].count, 1);
    assert.equal(stats[mixedFile].body.tu.tuv['ja-JP'].count, 1);
  });

  test('process files with different header attributes', async () => {
    const stats = await fileStats({
      cwd: testFilesDir,
      fileMatch: 'second.tmx',
    });

    assert.deepEqual(stats['second.tmx'].header, {
      creationtool: 'Second Tool',
      creationtoolversion: '2.0',
      segtype: 'block',
      'o-tmf': 'tmx',
      adminlang: 'en-GB',
      srclang: 'en-GB',
      datatype: 'html',
    });
  });

  test('use forward slashes in output keys for cross-platform consistency', async () => {
    const stats = await fileStats({
      cwd: testFilesDir,
      fileMatch: 'sample.tmx',
    });

    const keys = Object.keys(stats);
    keys.forEach(key => {
      assert.ok(!key.includes('\\'), `Key "${key}" should not contain backslashes`);
    });
  });
});
