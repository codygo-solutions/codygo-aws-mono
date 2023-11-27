import { readFileSync } from 'fs';
import { join } from 'path';

import { App } from 'aws-cdk-lib';
import { snakeCase } from 'lodash';

import { CustomProps } from './codygo-aws-stack';

export function getConfig(app: App, name: keyof CustomProps | 'stage', defaultValue: string) {
  return app.node.tryGetContext(name) || process.env[snakeCase(name).toUpperCase()] || defaultValue;
}

export const rootDir = join(__dirname, '../../../');

export const { version } = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
