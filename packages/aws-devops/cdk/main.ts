import { join } from 'path';

import { App } from 'aws-cdk-lib';
import { setStage } from '@codygo/cdk-utils';

import { CodygoAwsStack } from './codygo-aws-stack';
import { getConfig, rootDir, version } from './utils';

const app = new App();

const stage = getConfig(app, 'stage', 'dev');

const hostedZoneId = getConfig(app, 'hostedZoneId', 'Z1024540YG79TLQ4VSB8');

const hostedZoneName = getConfig(app, 'hostedZoneName', 'worknetai.com');

const baseSubDomain = getConfig(app, 'baseSubDomain', 'chat');

const wildcardCertificateArn = getConfig(
  app,
  'wildcardCertificateArn',
  'arn:aws:acm:us-east-1:372587107024:certificate/13eaefa4-00fc-4d8e-bd2c-0d31931937c7'
);

const frontendDistDir = getConfig(app, 'frontendDistDir', join(rootDir, 'apps/frontend/dist'));

// TODO: move auth0Domain config to parameter per env or default parameter

const auth0Domain = getConfig(app, 'auth0Domain', 'dev-x37pxyxg.us.auth0.com');

const auth0ClientId = getConfig(app, 'auth0ClientId', 'DKZDv90G0Z0W361hkhIa1EUEN0e5kT2N');

setStage(app, stage);

new CodygoAwsStack(app, {
  version,
  hostedZoneName,
  baseSubDomain,
  hostedZoneId,
  frontendDistDir,
  wildcardCertificateArn,
  auth0ClientId,
  auth0Domain,
});
