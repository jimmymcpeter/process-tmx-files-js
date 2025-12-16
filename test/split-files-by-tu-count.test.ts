import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { splitFilesByTuCount } from '../src/split-files-by-tu-count.js';
import { parseXml } from 'event-streaming-xml-parser';
import { TMX } from '../src/tmx.js';

describe('split-files-by-tu-count', () => {
  const dirname = `${path.dirname(url.fileURLToPath(import.meta.url))}`;
  const cwd = `${dirname}/files`;
  const outputPath = `./temp/split-test`;
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

  test('split file with more tu\'s than maxTuCount', async () => {
    await splitFilesByTuCount({
      cwd: cwd,
      fileMatch: 'split.tmx',
      outputPath: outputPath,
      maxTuCount: 2,
    });

    // Verify that 3 files were created (2 TUs in first two files, 1 TU in last file)
    const outputFile1 = path.join(testDir, 'split-1.tmx');
    const outputFile2 = path.join(testDir, 'split-2.tmx');
    const outputFile3 = path.join(testDir, 'split-3.tmx');

    assert.equal(fs.existsSync(outputFile1), true);
    assert.equal(fs.existsSync(outputFile2), true);
    assert.equal(fs.existsSync(outputFile3), true);

    // Count TUs in each file
    const tuCount1 = await countTuElements(outputFile1);
    const tuCount2 = await countTuElements(outputFile2);
    const tuCount3 = await countTuElements(outputFile3);

    assert.equal(tuCount1, 2);
    assert.equal(tuCount2, 2);
    assert.equal(tuCount3, 1);
  });

  test('not split file when tu count is below maxTuCount', async () => {
    await splitFilesByTuCount({
      cwd: cwd,
      fileMatch: 'split.tmx',
      outputPath: outputPath,
      maxTuCount: 100,
    });

    // Verify that only one file was created
    const outputFile1 = path.join(testDir, 'split-1.tmx');
    const outputFile2 = path.join(testDir, 'split-2.tmx');

    assert.equal(fs.existsSync(outputFile1), true);
    assert.equal(fs.existsSync(outputFile2), false);

    // Count TUs
    const tuCount = await countTuElements(outputFile1);
    assert.equal(tuCount, 5);
  });

  test('preserve header attributes in split files', async () => {
    await splitFilesByTuCount({
      cwd: cwd,
      fileMatch: 'split.tmx',
      outputPath: outputPath,
      maxTuCount: 2,
    });

    const outputFile1 = path.join(testDir, 'split-1.tmx');
    const outputFile2 = path.join(testDir, 'split-2.tmx');

    // Verify header in first file
    const header1 = await extractHeader(outputFile1);
    assert.equal(header1.creationtool, 'Test Tool');
    assert.equal(header1.creationtoolversion, '1.0');
    assert.equal(header1.srclang, 'en-US');

    // Verify header in second file
    const header2 = await extractHeader(outputFile2);
    assert.equal(header2.creationtool, 'Test Tool');
    assert.equal(header2.creationtoolversion, '1.0');
    assert.equal(header2.srclang, 'en-US');
  });

  test('handle file with header notes', async () => {
    await splitFilesByTuCount({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      maxTuCount: 2,
    });

    const outputFile1 = path.join(testDir, 'sample-1.tmx');
    
    // Verify header note is preserved
    const hasHeaderNote = await containsHeaderNote(outputFile1);
    assert.equal(hasHeaderNote, true);
  });

  // Helper function to count TU elements in a file
  async function countTuElements(filename: string): Promise<number> {
    let count = 0;
    let inBody = false;

    await parseXml({
      filename,
      listeners: {
        opentag: (tag) => {
          if (tag.name === TMX.bodyEleName) {
            inBody = true;
          }
          if (tag.name === TMX.tuEleName && inBody) {
            count++;
          }
        },
        text: () => {},
        closetag: (tag) => {
          if (tag.name === TMX.bodyEleName) {
            inBody = false;
          }
        },
        end: () => {},
      },
    });

    return count;
  }

  // Helper function to extract header attributes
  async function extractHeader(filename: string): Promise<Record<string, string>> {
    const header: Record<string, string> = {};
    let inTmx = false;

    await parseXml({
      filename,
      listeners: {
        opentag: (tag) => {
          if (tag.name === TMX.tmxEleName) {
            inTmx = true;
          }
          if (tag.name === TMX.headerEleName && inTmx) {
            Object.assign(header, tag.attributes);
          }
        },
        text: () => {},
        closetag: () => {},
        end: () => {},
      },
    });

    return header;
  }

  // Helper function to check if header contains a note
  async function containsHeaderNote(filename: string): Promise<boolean> {
    let hasNote = false;
    let inHeader = false;

    await parseXml({
      filename,
      listeners: {
        opentag: (tag) => {
          if (tag.name === TMX.headerEleName) {
            inHeader = true;
          }
          if (tag.name === 'note' && inHeader) {
            hasNote = true;
          }
        },
        text: () => {},
        closetag: (tag) => {
          if (tag.name === TMX.headerEleName) {
            inHeader = false;
          }
        },
        end: () => {},
      },
    });

    return hasNote;
  }
});
