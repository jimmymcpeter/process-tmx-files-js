import { describe, test, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert';
import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { removeInfoElements } from '../src/remove-info-elements.ts';

describe('remove-info-elements', async () => {
  const dirname = `${path.dirname(url.fileURLToPath(import.meta.url))}`;
  const cwd = `${dirname}/files`;
  const outputPath = `./temp/remove-props-test`;
  const testDir = path.join(cwd, outputPath);

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  test('removes notes and props by default', async () => {
    await removeInfoElements({
      cwd: cwd,
      fileMatch: [
        'sample.tmx',
      ],
      outputPath: outputPath,
      keepPropTypes: [
        'x-tuv-prop-b',
      ],
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    assert.equal(fileData.includes('<note>header note</note>'), false);
    assert.equal(fileData.includes('<note>tu note</note>'), false);
    assert.equal(fileData.includes('<note>tuv note</note>'), false);

    assert.equal(fileData.includes('<prop type="x-tu-prop-a">tu propa</prop>'), false);
    assert.equal(fileData.includes('<prop type="x-tuv-prop-b">tuv prop1</prop>'), true);
  });

  test('keeps notes when keepNotes is true', async () => {
    await removeInfoElements({
      cwd: cwd,
      fileMatch: [
        'sample.tmx',
      ],
      outputPath: outputPath,
      keepNotes: true,
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    assert.equal(fileData.includes('<note>header note</note>'), true);
    assert.equal(fileData.includes('<note>tu note</note>'), true);
    assert.equal(fileData.includes('<note>tuv note</note>'), true);

    // All props should be removed
    assert.equal(fileData.includes('<prop type="x-tu-prop-a">tu propa</prop>'), false);
    assert.equal(fileData.includes('<prop type="x-tuv-prop-b">tuv prop1</prop>'), false);
  });
});
