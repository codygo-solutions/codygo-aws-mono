import {
  APIGatewayProxyWithLambdaAuthorizerEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

export async function handler(
  event: APIGatewayProxyWithLambdaAuthorizerEvent<unknown>,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(JSON.stringify({ event, context }, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify(event.requestContext.authorizer),
  };
}
