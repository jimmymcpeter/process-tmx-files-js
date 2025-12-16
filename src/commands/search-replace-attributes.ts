import { Args, Command, Flags } from '@oclif/core';
import { CommandError } from '@oclif/core/interfaces';
import { searchReplaceAttributes } from '../index.js';

export class SearchReplaceAttributesCommand extends Command {
  static summary = 'Search & Replace Attributes';

  static description = 'Search and replace attribute values in TMX files';

  protected async catch(err: CommandError): Promise<any> {
    this.error(err.message);
  }

  static args = {};

  static flags = {
    cwd: Flags.directory({
      char: 'W',
      summary: 'Current working directory',
      description: 'Current working directory in which to search for TMX files',
      required: false,
      default: process.cwd(),
    }),
    fileMatch: Flags.string({
      char: 'F',
      summary: 'File match pattern',
      description: 'TMX file match glob pattern(s)',
      required: true,
      multiple: true,
      multipleNonGreedy: true,
      helpValue: '**/*.tmx',
    }),
    fileIgnore: Flags.string({
      char: 'I',
      summary: 'File ignore pattern',
      description: 'TMX file ignore glob pattern(s)',
      required: false,
      multiple: true,
      multipleNonGreedy: true,
      default: [],
    }),
    outputPath: Flags.directory({
      char: 'O',
      summary: 'Output directory',
      description: 'Output directory for TMX files',
      required: true,
      helpValue: 'cleaned',
    }),
    tagNames: Flags.string({
      char: 'T',
      summary: 'Tag names',
      description: 'Tag names to limit search & replace to',
      required: false,
      multiple: true,
      multipleNonGreedy: true,
      default: [],
    }),
    attributeNames: Flags.string({
      char: 'A',
      summary: 'Attribute names',
      description: 'Attribute names to limit search & replace to',
      required: false,
      multiple: true,
      multipleNonGreedy: true,
      default: [],
    }),
    searchPattern: Flags.string({
      char: 'S',
      summary: 'Search RegExp pattern',
      description: 'Search RegExp pattern for attribute values',
      required: true,
    }),
    searchFlags: Flags.string({
      char: 'R',
      summary: 'Search flags',
      description: 'Flags for the search pattern (ex: "i" for case-insensitive)',
      required: false,
      default: '',
    }),
    replacementValue: Flags.string({
      char: 'V',
      summary: 'Replacement value',
      description: 'Replacement value for attribute values',
      required: true,
    }),
  };

  async run() {
    const { args, flags } = await this.parse(SearchReplaceAttributesCommand);

    await searchReplaceAttributes(flags);
  }
}
