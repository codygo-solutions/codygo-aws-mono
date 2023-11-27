import { APIGatewayAuthorizerEvent } from 'aws-lambda';

import { authorize } from './authorize';

const GOOD_EVENT = {
  type: 'TOKEN',
  authorizationToken:
    'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlZYWTRjdnhqY1pRRE9tYklQemJiYyJ9.eyJpc3MiOiJodHRwczovL2Rldi14MzdweHl4Zy51cy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDE4MjM5NDcyOTE1Njk3MDIzMjciLCJhdWQiOlsiYXV0aC1hcGkiLCJodHRwczovL2Rldi14MzdweHl4Zy51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzAwOTkzMzI1LCJleHAiOjE3MDEwNzk3MjUsImF6cCI6IkRLWkR2OTBHMFowVzM2MWhraElhMUVVRU4wZTVrVDJOIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.QKSvog3oRC63bslcZf7z1y77PksER49qSByl7ZLLPvHVonJnuTDDVeulktEkh8rTnYnb5SoQJVlQWwQMV_1RW-cySezD4qan4J8-CKH_ARSU8e1WoO5fqn_uaIkYxWSqSPh5bNgjEeRUXgkoqgXFWJF2YEZAnwr4kR10KcSagT_fxEahNlk3t0isA6hjB-9YwGlIoTGqY7ysknW6CpGpYjhiz9DlJbYsOPhvOE_FJFQayjfBSU_FSXTWNtH3oXhyy7ThUj-rMMEl735FqlGaZVcZxqP-FoTHd8jU_abDdjSozBTMv4V80NzY17j2AZuDaSUUtIhO8siIgAtRp7uxRw',
  //'Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiaXNzIjoiaHR0cHM6Ly9kZXYteDM3cHh5eGcudXMuYXV0aDAuY29tLyJ9..2gZ4KQ8z85CK39aB.olnWj1GMRPlCuvoyWKbZZ_OB-nEI2LbGcM7oA88K6hRB6IbYoV1DGQeSgPWYPmPx2Yvg7emVx3q9yhfdNYKZNRqXai2w2T-kIm8lh3TGOUv_PG7gpAY5qJyoFznFZMJ7nsectnzCVcsbAYRruPm0qcA4mpd4os1eeygZbY5WkbS401uW95NidL8wDWyP1yieDGptXfi3sxNyThuD2n5uuZiKimIGwqJqOQXM3iqJoKlzY0FesV5utRTBkntgo0AwFifMNBa8wGAARCtvo6M7-IRGpbk19P80V_5U_qqQwVQJ17DxvglO71MvSGPTCiYFa93jtKK8cg.Un_Ziv2QRIHBIzOnFnJdTQ',
  methodArn: 'arn:aws:execute-api:us-east-1:1234567890:apiId/stage/method/resourcePath',
} satisfies APIGatewayAuthorizerEvent;

describe('authorize', () => {
  let env = process.env;

  beforeEach(() => {
    env = process.env;
  });
  afterEach(() => {
    process.env = env;
  });

  it('should work when given good event', async () => {
    await authorize(GOOD_EVENT);
  });

  it('should fail when authorizationToken is not correct format', async () => {
    await expect(authorize({ ...GOOD_EVENT, authorizationToken: '' })).rejects.toThrow(
      'Invalid authorizationToken structure'
    );

    await expect(
      authorize({ ...GOOD_EVENT, authorizationToken: `X${GOOD_EVENT.authorizationToken}` })
    ).rejects.toThrow('Invalid authorizationToken structure');

    await expect(
      authorize({
        ...GOOD_EVENT,
        authorizationToken: GOOD_EVENT.authorizationToken.replace('Bearer', 'bearer'),
      })
    ).rejects.toThrow('Invalid authorizationToken structure');

    await expect(authorize({ ...GOOD_EVENT, authorizationToken: 'Bearer x' })).rejects.toThrow(
      'Could not decode token'
    );

    await expect(
      authorize({ ...GOOD_EVENT, authorizationToken: `${GOOD_EVENT.authorizationToken}XXX` })
    ).rejects.toThrow('invalid signature');
  });

  it('should return only fields in whitelist', async () => {
    const contextFieldsWhitelist = ['sub', 'email'];
    const { context } = await authorize(GOOD_EVENT, { contextFieldsWhitelist });
    expect(Object.keys(context!)).toEqual(contextFieldsWhitelist);
  });
});
