import { Args, Command, Flags } from '@oclif/core';
import { CommandError } from '@oclif/core/interfaces';
import { fileStats } from '../index.js';

export class FileStatsCommand extends Command {
  static summary = 'File Stats';

  static description = 'Get file stats for TMX files';

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
  };

  async run() {
    const { args, flags } = await this.parse(FileStatsCommand);

    this.logJson(await fileStats(flags));
  }
}
