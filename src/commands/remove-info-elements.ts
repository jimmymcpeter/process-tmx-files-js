import { Args, Command, Flags } from '@oclif/core';
import { CommandError } from '@oclif/core/interfaces';
import { removeInfoElements } from '../index.js';

export class RemoveInfoElementsCommand extends Command {
  static summary = 'Remove Info Elements';

  static description = 'Remove info elements from TMX files to reduce file size';

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
    keepNotes: Flags.boolean({
      char: 'N',
      summary: 'Keep notes',
      description: 'Keep note elements',
      required: false,
      default: false,
    }),
    keepPropTypes: Flags.string({
      char: 'K',
      summary: 'Keep prop types',
      description: 'Prop elements with type attributes to keep (ex: context_next)',
      required: false,
      multiple: true,
      default: [],
      helpValue: 'context_prev context_next',
    }),
  };

  async run() {
    const { args, flags } = await this.parse(RemoveInfoElementsCommand);

    await removeInfoElements(flags);
  }
}
