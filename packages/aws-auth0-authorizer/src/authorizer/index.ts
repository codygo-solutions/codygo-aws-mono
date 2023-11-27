import {
  APIGatewayAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';

import { authorize } from './authorize';

const AUTH0_DOMAINS_WHITELIST =
  process.env.ALLOWED_AUTH0_WHITELIST?.split(',')?.map((d) => d.trim()) || [];

const AUTH0_AUDIENCES_WHITELIST =
  process.env.AUTH0_AUDIENCES_WHITELIST?.split(',')?.map((d) => d.trim()) || [];

const AUTH0_CONTEXT_FIELDS_WHITELIST =
  process.env.AUTH0_CONTEXT_FIELDS_WHITELIST?.split(',')?.map((d) => d.trim()) || [];

const RESOURCES_WHITELIST = process.env.RESOURCES_WHITELIST?.split(',')?.map((d) => d.trim()) || [];

export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  try {
    return authorize(event, {
      domainWhitelist: AUTH0_DOMAINS_WHITELIST,
      audiencesWhitelist: AUTH0_AUDIENCES_WHITELIST,
      contextFieldsWhitelist: AUTH0_CONTEXT_FIELDS_WHITELIST,
      resourcesWhitelist: RESOURCES_WHITELIST,
    });
  } catch (error) {
    console.error({
      error,
      event,
      env: {
        AUTH0_DOMAINS_WHITELIST,
        AUTH0_AUDIENCES_WHITELIST,
        AUTH0_CONTEXT_FIELDS_WHITELIST,
        RESOURCES_WHITELIST,
      },
    });
    throw new Error('Unauthorized');
  }
}
