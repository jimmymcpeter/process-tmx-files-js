import path from 'node:path';
import fs from 'node:fs';
import { globSync as glob } from 'glob';
import { parseXml, escapeXmlElement, escapeXmlAttribute } from 'event-streaming-xml-parser';
import { createMissingDirectory } from './utils.js';

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
type Defaults<T> = Required<Pick<T, OptionalKeys<T>>>;

export interface SearchReplaceAttributesOptions {
  cwd?: string,
  fileMatch: string | string[];
  fileIgnore?: string | string[];
  outputPath: string;
  tagNames?: string | string[];
  attributeNames?: string | string[];
  searchPattern: string;
  searchFlags?: string;
  replacementValue: string;
}

export async function searchReplaceAttributes(opts: SearchReplaceAttributesOptions) {
  const defaultOptions: Defaults<SearchReplaceAttributesOptions> = {
    cwd: process.cwd(),
    fileIgnore: [],
    tagNames: [],
    attributeNames: [],
    searchFlags: '',
  };

  const options = Object.assign({}, defaultOptions, opts);

  const tmxFiles = glob(options.fileMatch, {
    ignore: options.fileIgnore,
    cwd: options.cwd,
  });
  console.log(`Found ${tmxFiles.length} file(s)`);

  for (const tmxFile of tmxFiles) {
    await searchAndReplaceFromFile(tmxFile);
  }

  async function searchAndReplaceFromFile(filename: string) {
    console.log(`Processing ${filename}...`);
    
    const outputFile = path.join(
      options.cwd,
      options.outputPath,
      filename
    );
    console.log(`Output to ${outputFile}`);

    createMissingDirectory(path.dirname(outputFile), true);

    const outputStream = fs.createWriteStream(outputFile, { flags: 'w' });
    outputStream.write(`<?xml version="1.0" encoding="UTF-8"?>`);

    const searchRegExp = new RegExp(
      `${options.searchPattern}`,
      options.searchFlags
    );
    const replacementValue = options.replacementValue;

    const tagNames = Array.isArray(options.tagNames)
      ? options.tagNames.map(name => name.toLowerCase())
      : [options.tagNames.toLowerCase()];

    const attributeNames = Array.isArray(options.attributeNames)
      ? options.attributeNames.map(name => name.toLowerCase())
      : [options.attributeNames.toLowerCase()];

    await parseXml({
      filename: path.join(options.cwd, filename),
      listeners: {
        opentag: (tag) => {
          let output = `<${tag.name}`;
          for (const [key, value] of Object.entries(tag.attributes)) {
            if (
              (tagNames.length === 0 || tagNames.includes(tag.name.toLowerCase())) &&
              (attributeNames.length === 0 || attributeNames.includes(key.toLowerCase()))
            ) {
              const newValue = value.replace(searchRegExp, replacementValue);
              output += ` ${key}="${escapeXmlAttribute(newValue)}"`;
            } else {
              output += ` ${key}="${escapeXmlAttribute(value)}"`;
            }
          }

          if (!tag.isSelfClosing) {
            output += `>`;
          }

          outputStream.write(output);
        },

        text: (text) => {
          outputStream.write(escapeXmlElement(text));
        },

        closetag: (tag) => {
          outputStream.write(tag.isSelfClosing ? `/>` : `</${tag.name}>`);
        },

        end: () => {
          outputStream.close();
        }
      }
    });
  }
}
