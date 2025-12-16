import fs from 'node:fs';
import { globSync as glob } from 'glob';
import path from 'node:path';
import { createMissingDirectory } from './utils.js';
import { parseXml, escapeXmlAttribute, escapeXmlElement } from 'event-streaming-xml-parser';
import { TMX } from './tmx.js';

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
type Defaults<T> = Required<Pick<T, OptionalKeys<T>>>;

export interface RemoveInfoElementsOptions {
  cwd?: string,
  fileMatch: string | string[];
  fileIgnore?: string | string[];
  outputPath: string;
  keepNotes?: boolean;
  keepPropTypes?: string[];
}

export async function removeInfoElements(opts: RemoveInfoElementsOptions) {
  const defaultOptions: Defaults<RemoveInfoElementsOptions> = {
    cwd: process.cwd(),
    fileIgnore: [],
    keepNotes: false,
    keepPropTypes: [],
  };

  const options = Object.assign({}, defaultOptions, opts);

  const tmxFiles = glob(options.fileMatch, {
    ignore: options.fileIgnore,
    cwd: options.cwd,
  });
  console.log(`Found ${tmxFiles.length} file(s)`);

  for (const tmxFile of tmxFiles) {
    await removeInfoElementsFromFile(tmxFile);
  }

  async function removeInfoElementsFromFile(filename: string) {
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

    let inExcluded = false;
    let currentExcludedTagName = '';
    const keepNotes = options.keepNotes;
    const keepPropTypes = options.keepPropTypes;

    await parseXml({
      filename: path.join(options.cwd, filename),
      listeners: {
        opentag: (tag) => {
          if (TMX.noteEleName == tag.name && !keepNotes) {
            inExcluded = true;
            currentExcludedTagName = tag.name;

          } else if (TMX.propEleName == tag.name) {
            inExcluded = true;
            currentExcludedTagName = tag.name;
    
            for (const propTagType of keepPropTypes) {
              if (tag.attributes['type'] == propTagType) {
                inExcluded = false;
                currentExcludedTagName = '';
                break;
              }
            }
          }
    
          if (!inExcluded) {
            let output = `<${tag.name}`;
    
            for (const [key, value] of Object.entries(tag.attributes)) {
              output += ` ${key}="${escapeXmlAttribute(value)}"`;
            }
    
            if (!tag.isSelfClosing) {
              output += `>`;
            }
    
            outputStream.write(output);
          }
        },

        text: (text) => {
          if (!inExcluded) {
            outputStream.write(escapeXmlElement(text));
          }
        },

        closetag: (tag) => {
          if (!inExcluded) {
            outputStream.write(tag.isSelfClosing ? `/>` : `</${tag.name}>`);
          } else if (inExcluded && currentExcludedTagName == tag.name) {
            inExcluded = false;
            currentExcludedTagName = '';
          }
        },

        end: async () => {
          await new Promise<void>((resolve) => {
            outputStream.end(resolve);
          });
        }
      }
    });
  }
}
