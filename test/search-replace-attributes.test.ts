import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { searchReplaceAttributes } from '../src/search-replace-attributes.ts';

describe('search-replace-attributes', async () => {
  const dirname = `${path.dirname(url.fileURLToPath(import.meta.url))}`;
  const cwd = `${dirname}/files`;
  const outputPath = `./temp/search-replace-test`;
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
  
  test('replaces attribute values matching search pattern', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      searchPattern: 'en-US',
      replacementValue: 'en-GB',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Should replace xml:lang attributes
    assert.equal(fileData.includes('xml:lang="en-US"'), false);
    assert.equal(fileData.includes('xml:lang="en-GB"'), true);
    
    // Should also replace in header attributes
    assert.equal(fileData.includes('adminlang="en-GB"'), true);
    assert.equal(fileData.includes('srclang="en-GB"'), true);
  });

  test('replaces only in specified tag names', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      tagNames: 'tuv',
      searchPattern: 'en-US',
      replacementValue: 'en-GB',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Should replace in tuv elements
    assert.equal(fileData.includes('<tuv xml:lang="en-GB">'), true);
    assert.equal(fileData.includes('<tuv xml:lang="en-US">'), false);
    
    // Should NOT replace in header element
    assert.equal(fileData.includes('adminlang="en-US"'), true);
    assert.equal(fileData.includes('srclang="en-US"'), true);
  });

  test('replaces only in specified attribute names', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      attributeNames: 'xml:lang',
      searchPattern: 'en-US',
      replacementValue: 'en-GB',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Should replace xml:lang attributes
    assert.equal(fileData.includes('xml:lang="en-GB"'), true);
    assert.equal(fileData.includes('xml:lang="en-US"'), false);
    
    // Should NOT replace other attributes
    assert.equal(fileData.includes('adminlang="en-US"'), true);
    assert.equal(fileData.includes('srclang="en-US"'), true);
  });

  test('replaces only in specified tag and attribute names', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      tagNames: 'tuv',
      attributeNames: 'xml:lang',
      searchPattern: 'fr-FR',
      replacementValue: 'fr-CA',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Should replace in tuv xml:lang
    assert.equal(fileData.includes('<tuv xml:lang="fr-CA">'), true);
    assert.equal(fileData.includes('<tuv xml:lang="fr-FR">'), false);
    
    // Other languages should remain unchanged
    assert.equal(fileData.includes('xml:lang="en-US"'), true);
    assert.equal(fileData.includes('xml:lang="es-ES"'), true);
  });

  test('uses regex flags for case-insensitive replacement', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      attributeNames: 'adminlang',
      searchPattern: 'EN-us',
      searchFlags: 'i',
      replacementValue: 'en-GB',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Should replace despite case difference
    assert.equal(fileData.includes('adminlang="en-US"'), false);
    assert.equal(fileData.includes('adminlang="en-GB"'), true);
  });

  test('supports regex pattern with capturing groups', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      searchPattern: '([a-z]+)-([A-Z]+)',
      replacementValue: '$2-$1',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Should swap language and region codes
    assert.equal(fileData.includes('xml:lang="US-en"'), true);
    assert.equal(fileData.includes('xml:lang="FR-fr"'), true);
    assert.equal(fileData.includes('xml:lang="ES-es"'), true);
  });

  test('handles empty attribute values', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      attributeNames: 'datatype',
      tagNames: 'tuv',
      searchPattern: '^$',
      replacementValue: 'default',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // Empty attributes should be set
    assert.equal(fileData.includes('datatype="default"'), true);
  });

  test('handles files with no matching attributes', async () => {
    await searchReplaceAttributes({
      cwd: cwd,
      fileMatch: 'sample.tmx',
      outputPath: outputPath,
      attributeNames: 'nonexistent',
      searchPattern: 'anything',
      replacementValue: 'replacement',
    });

    const fileData = fs.readFileSync(path.join(testDir, 'sample.tmx'), 'utf8');

    // File should be copied without changes
    assert.equal(fileData.includes('replacement'), false);
  });
});
