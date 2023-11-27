import { getStage, stagedName } from '@codygo/cdk-utils';
import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AuthorizationType,
  LambdaIntegration,
  LambdaRestApi,
  RestApi,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  OriginBase,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  OriginSslPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import {
  HttpOrigin,
  RestApiOrigin,
  RestApiOriginProps,
  S3Origin,
} from 'aws-cdk-lib/aws-cloudfront-origins';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ARecord, HostedZone, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { camelCase } from 'lodash';

export interface CustomProps {
  hostedZoneName: string;
  baseSubDomain: string;
  hostedZoneId: string;
  frontendDistDir: string;
  wildcardCertificateArn: string;
  version: string;
  auth0ClientId: string;
  auth0Domain: string;
}

export class CodygoAwsStack extends Stack {
  constructor(
    scope: Construct,
    private readonly props: Partial<StackProps & CustomProps>
  ) {
    super(scope, CodygoAwsStack.name, { ...props });

    const authorizerLambda = this.createFunction('authorizer');

    const testLambda = this.createFunction('authorizer-sample');

    const authorizer = new TokenAuthorizer(this, 'Auth0Authorizer', {
      handler: authorizerLambda,
      resultsCacheTtl: Duration.hours(1),
    });

    const api = new LambdaRestApi(this, 'Auth0AuthorizerTestApi', {
      restApiName: 'auth0-authorizer-test-api',
      handler: testLambda,
      proxy: true,
      defaultMethodOptions: {
        authorizationType: AuthorizationType.CUSTOM,
        authorizer,
      },
    });

    // new CfnOutput(this, 'BaseUrl', { value: `https://${this.getFullDomainName()}` });
  }

  createFunction(name: string) {
    const functionName = `auth0-${name}-lambda`;
    return new Function(this, camelCase(functionName), {
      functionName,
      code: Code.fromAsset(`${__dirname}../../../aws-auth0-authorizer/dist/${name}`),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_18_X,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });
  }
}
