import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { Jwt, JwtPayload, decode, verify } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

interface JwtTypedPayload extends Partial<Jwt> {
  payload?: JwtPayload;
}

const jwksClientByUri: Record<string, JwksClient> = {};

function getJwksClient(uri: string) {
  if (!jwksClientByUri[uri]) {
    const client = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: uri,
    });
    jwksClientByUri[uri] = client;
  }

  return jwksClientByUri[uri];
}

export async function authorize(
  event: APIGatewayTokenAuthorizerEvent,
  {
    domainWhitelist = [],
    audiencesWhitelist = [],
    contextFieldsWhitelist = [],
    resourcesWhitelist = [],
  }: {
    domainWhitelist?: string[];
    audiencesWhitelist?: string[];
    contextFieldsWhitelist?: string[];
    resourcesWhitelist?: string[];
  } = {}
): Promise<APIGatewayAuthorizerResult> {
  if (event.type !== 'TOKEN') {
    throw new Error(`Unsupported event.type ${event.type}`);
  }

  const token = event.authorizationToken?.match(/^Bearer (.*)$/)?.[1];

  if (!token) {
    throw new Error('Invalid authorizationToken structure. Use "Bearer <token>"');
  }

  const { header, payload } = (decode(token, { complete: true }) || {}) as JwtTypedPayload;

  if (!header?.kid || !payload?.iss || !payload?.aud) {
    throw Error('Could not decode token');
  }

  if (domainWhitelist.length && !domainWhitelist.includes(payload.iss)) {
    throw new Error(`Invalid iss ${payload.iss} -> ${domainWhitelist.join(',')}`);
  }

  if (audiencesWhitelist.length && !audiencesWhitelist.some((aud) => payload.aud!.includes(aud))) {
    throw new Error(`Invalid aud ${payload.aud} -> ${audiencesWhitelist.join(',')}`);
  }

  const jwksUri = `${payload.iss}.well-known/jwks.json`;

  const client = getJwksClient(jwksUri);
  const { getPublicKey } = await client.getSigningKey(header.kid);
  const publicKey = getPublicKey();

  const verifiedPayload = verify(token, publicKey) as JwtPayload;

  const url = `${payload.iss}userinfo`;

  const profile = await fetch(url, {
    headers: {
      Authorization: event.authorizationToken,
    },
  }).then((res) => res.json());

  const context = Object.entries({
    ...verifiedPayload,
    ...profile,
  })
    .filter(([key]) => contextFieldsWhitelist.length === 0 || contextFieldsWhitelist.includes(key))
    .reduce(
      (obj, [key, val]) => {
        const needStringify = Array.isArray(val) || ['object', 'function'].includes(typeof val);
        const v = needStringify ? JSON.stringify(val) : val;
        const k = needStringify ? `${key}_json` : key;
        // @ts-expect-error type unknown is not assignable
        obj[k] = v;
        return obj;
      },
      {} as NonNullable<APIGatewayAuthorizerResult['context']>
    );

  const result = {
    principalId: payload.sub!,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: resourcesWhitelist.length ? resourcesWhitelist : event.methodArn,
        },
      ],
    },
    context,
  };

  return result;
}
