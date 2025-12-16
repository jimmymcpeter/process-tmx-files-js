import fs from 'node:fs';

export function createMissingDirectory(
  path: string,
  recrusive: boolean = true
) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {
      recursive: recrusive,
    });
  }
}
