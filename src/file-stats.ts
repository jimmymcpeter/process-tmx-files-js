import path from 'node:path';
import fs from 'node:fs';
import { globSync as glob } from 'glob';
import { parseXml } from 'event-streaming-xml-parser';
import { TMX } from './tmx.js';

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
type Defaults<T> = Required<Pick<T, OptionalKeys<T>>>;

export interface FileStatsOptions {
  cwd?: string,
  fileMatch: string | string[];
  fileIgnore?: string | string[];
}

export interface FileStatsOutputObj {
  'header': {
    [attribute: string]: string,
  },
  'body': {
    'tu': {
      'count': number,
      'tuv': {
        [lang: string]: {
          'count': number,
        };
      },
    },
  },
  'size': number;
};

export async function fileStats(opts: FileStatsOptions) {
  const defaultOptions: Defaults<FileStatsOptions> = {
    cwd: process.cwd(),
    fileIgnore: [],
  };

  const options = Object.assign({}, defaultOptions, opts);

  const output: {
    [file: string]: FileStatsOutputObj;
  } = {};
  const tmxFiles = glob(options.fileMatch, {
    ignore: options.fileIgnore,
    cwd: options.cwd,
  });
  console.debug(`Found ${tmxFiles.length} file(s)`);

  for (const tmxFile of tmxFiles) {
    // Convert backslashes to forward slashes to be consistent across platforms
    const filename = tmxFile.replace(/\\/g, '/');
    output[filename] = await getStatsFromFile(tmxFile);
  }
  
  return output;


  async function getStatsFromFile(filename: string) {
    console.debug(`Processing ${filename}...`);

    const filepath = path.join(options.cwd, filename);

    const fileStats: FileStatsOutputObj = {
      header: {},
      body: {
        tu: {
          count: 0,
          tuv: {},
        },
      },
      size: 0,
    };

    let inTmx = false;
    let inHeader = false;
    let inBody = false;
    let inTu = false;
    let inTuv = false;
    let tuvLang = '';

    await parseXml({
      filename: filepath,
      listeners: {
        opentag: (tag) => {
          if (TMX.tmxEleName == tag.name) {
            inTmx = true;
            return;
          }

          if (TMX.headerEleName == tag.name && inTmx) {
            inHeader = true;

            for (const tagAttribute in tag.attributes) {
              fileStats.header[tagAttribute] = tag.attributes[tagAttribute] ?? '';
            }
          }

          if (TMX.bodyEleName == tag.name) {
            inBody = true;
          }
    
          if (TMX.tuEleName == tag.name && inBody) {
            inTu = true;
    
            fileStats.body.tu.count++;
          }
          
          if (TMX.tuvEleName == tag.name && inTu) {
            inTuv = true;
    
            tuvLang = tag.attributes[TMX.xmlLangAttrName] ?? '';
    
            if (!fileStats.body.tu.tuv[tuvLang]) {
              fileStats.body.tu.tuv[tuvLang] = {
                count: 0,
              }
            }
    
            fileStats.body.tu.tuv[tuvLang]!.count++;
          }
        },

        text: (text) => {},

        closetag: (tag) => {
          if (TMX.tmxEleName == tag.name && inTmx) {
            inTmx = false;
          }
          if (TMX.headerEleName == tag.name && inHeader) {
            inHeader = false;
          }
          if (TMX.bodyEleName == tag.name && inBody) {
            inBody = false;
          }
          if (TMX.tuEleName == tag.name && inTu) {
            inTu = false;
          }
          if (TMX.tuvEleName == tag.name && inTuv) {
            inTuv = false;
            tuvLang = '';
          }
        },

        end: () => {},
      }
    });

    fileStats.size = fs.statSync(filepath).size;

    return fileStats;
  }
}
