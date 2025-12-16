#!/usr/bin/env -S npx tsx

// eslint-disable-next-line n/shebang
import { execute } from '@oclif/core';

await execute({ development: true, dir: import.meta.url });
