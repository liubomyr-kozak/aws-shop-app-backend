import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

function generatePolicy(principalId: string, effect: 'Allow'|'Deny', resource: string): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context: { user: principalId },
    };
}

function unauthorized(statusCode: 401 | 403): never {
    const err: any = new Error(statusCode === 401 ? 'Unauthorized' : 'Forbidden');
    err.statusCode = statusCode;
    throw err;
}

export const main = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    const authHeader = event.authorizationToken;

    if (!authHeader) {
        unauthorized(401);
    }

    const [scheme, token] = authHeader.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'basic' || !token) {
        unauthorized(401);
    }

    let decoded: string;
    try {
        decoded = Buffer.from(token, 'base64').toString('utf8');
    } catch {
        unauthorized(401);
    }

    const [login, password] = decoded.split(':');
    if (!login || !password) {
        unauthorized(401);
    }

    const expected = process.env[login];

    if (!expected) {
        unauthorized(403);
    }

    if (expected !== password) {
        unauthorized(403);
    }

    return generatePolicy(login, 'Allow', event.methodArn);
};