import fs from 'node:fs';
import { globSync as glob } from 'glob';
import path from 'node:path';
import { createMissingDirectory } from './utils.js';
import { parseXml, createTagOpenXml, escapeXmlElement } from 'event-streaming-xml-parser';
import { TMX } from './tmx.js';

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
type Defaults<T> = Required<Pick<T, OptionalKeys<T>>>;

export interface SplitFilesByTuCountOptions {
  cwd?: string,
  fileMatch: string | string[];
  fileIgnore?: string | string[];
  outputPath: string;
  maxTuCount?: number;
}

export async function splitFilesByTuCount(opts: SplitFilesByTuCountOptions) {
  const defaultOptions: Defaults<SplitFilesByTuCountOptions> = {
    cwd: process.cwd(),
    fileIgnore: [],
    maxTuCount: 100000,
  };

  const options = Object.assign({}, defaultOptions, opts);

  const tmxFiles = glob(options.fileMatch, {
    ignore: options.fileIgnore,
    cwd: options.cwd,
  });
  console.log(`Found ${tmxFiles.length} file(s)`);

  for (const tmxFile of tmxFiles) {
    await splitFileByTu(tmxFile);
  }

  async function splitFileByTu(filename: string) {
    console.log(`Processing ${filename}...`);

    const maxTuCount = options.maxTuCount;
    
    const xmlDeclaration = `<?xml version="1.0" encoding="utf-8"?>`;
    const tmxXmlOpen = `<${TMX.tmxEleName} version="${TMX.tmxVersion}">`;
    const tmxXmlClose = `</${TMX.tmxEleName}>`;
    const bodyXmlOpen = `<${TMX.bodyEleName}>`;
    const bodyXmlClose = `</${TMX.bodyEleName}>`;

    const startXml = `${xmlDeclaration}${tmxXmlOpen}`;
    const endXml = `${bodyXmlClose}${tmxXmlClose}`;

    let headerXml = ``;

    let inTmx = false;
    let inHeader = false;
    let inBody = false;
    let inTu = false;

    let fileNo = 1;
    let fileTuCount = 0;

    let outputStream = openOutputFile(filename, fileNo, `${startXml}${headerXml}`);
    
    await parseXml({
      filename: path.join(options.cwd, filename),
      listeners: {
        opentag: (tag) => {
          const outputStr = createTagOpenXml(tag);
    
          if (TMX.tmxEleName == tag.name) {
            inTmx = true;
            return;
          }
    
          if (TMX.headerEleName == tag.name && inTmx) {
            inHeader = true;
          }
    
          if (inHeader) {
            headerXml += outputStr;
          }
    
          if (TMX.bodyEleName == tag.name && inTmx) {
            inBody = true;
          }
    
          if (TMX.tuEleName == tag.name && inBody) {
            inTu = true;
            fileTuCount++;
            if (fileTuCount > maxTuCount) {
              fileNo++;
              outputStream.write(`${endXml}`);
              outputStream.close();
    
              outputStream = openOutputFile(filename, fileNo, `${startXml}${headerXml}${bodyXmlOpen}`);
              fileTuCount = 1;
            }
          }
          
          outputStream.write(outputStr);
        },

        text: (text: string) => {
          const outputStr = escapeXmlElement(text);
          if (inHeader) {
            headerXml += outputStr;
          }
          outputStream.write(outputStr);
        },

        closetag: (tag) => {
          const outputStr = tag.isSelfClosing ? `/>` : `</${tag.name}>`;
    
          if (TMX.tmxEleName == tag.name && inTmx) {
            inTmx = false;
          }
    
          if (inHeader) {
            headerXml += outputStr;
          }
    
          if (TMX.headerEleName == tag.name && inHeader) {
            inHeader = false;
          }
    
          if (TMX.bodyEleName == tag.name && inTmx) {
            inBody = false;
          }
    
          if (TMX.tuEleName == tag.name && inTu) {
            inTu = false;
          }
    
          outputStream.write(outputStr);
        },

        end: () => {
          outputStream.close();
          if (fileNo > 1 && fileTuCount == 0) {
            // Delete file with no tu elements
            fs.rmSync(outputFile(filename, fileNo));
          }
        }
      }
    });
  }

  function outputFile(filename: string, fileNoSuffix: number) {
    const outputBaseFile = path.join(
      options.cwd,
      options.outputPath,
      filename
    );
    
    const outputFileParts = path.parse(outputBaseFile) as path.FormatInputPathObject;
    delete outputFileParts.base;
    outputFileParts.name = `${outputFileParts.name}-${fileNoSuffix}`;

    const outputFile = path.format(outputFileParts);
    return outputFile;
  }

  function openOutputFile(filename: string, fileNoSuffix: number, startXml: string, ) {
    const outputFilename = outputFile(filename, fileNoSuffix);
    console.log(`Splitting into ${outputFilename}...`);

    createMissingDirectory(path.dirname(outputFilename), true);

    const outputStream = fs.createWriteStream(outputFilename, { flags: 'w' });

    outputStream.write(`${startXml}`);

    return outputStream;
  }
}
