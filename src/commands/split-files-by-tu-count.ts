import { Args, Command, Flags } from '@oclif/core';
import { CommandError } from '@oclif/core/interfaces';
import { splitFilesByTuCount } from '../index.js';

export class SplitFilesByTuCountCommand extends Command {
  static summary = 'Split Files by tu count';

  static description = 'Split TMX files by tu element count';

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
      helpValue: 'split',
    }),
    maxTuCount: Flags.integer({
      char: 'M',
      summary: 'Max tu element count',
      description: 'Split TMX files when the tu element count exceeds the max',
      required: false,
      default: 100000,
      min: 1,
    }),
  };

  async run() {
    const { args, flags } = await this.parse(SplitFilesByTuCountCommand);

    await splitFilesByTuCount(flags);
  }
}
