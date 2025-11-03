import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

export class AuthorizationServiceStack extends cdk.Stack {
    public readonly basicAuthorizerFn: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const envPath = path.join(__dirname, '..', '.env');
        let authorizerEnv: Record<string, string> = {};

        if (fs.existsSync(envPath)) {
            const parsed = dotenv.parse(fs.readFileSync(envPath));
            Object.entries(parsed).forEach(([k, v]) => {
                // Add all non-AWS related environment variables as credentials
                if (!k.startsWith('AWS_') && !k.startsWith('CDK_') && k !== 'EMAIL') {
                    // Sanitize key to satisfy Lambda env var constraints: [a-zA-Z]([a-zA-Z0-9_])+
                    let sanitized = k.replace(/[^A-Za-z0-9_]/g, '_');
                    if (!/^[A-Za-z]/.test(sanitized)) {
                        sanitized = `U_${sanitized}`; // ensure starts with a letter
                    }
                    authorizerEnv[sanitized] = v;
                }
            });
        } else {
            console.warn('.env not found in authorization-service; the authorizer will have no users.');
        }

        this.basicAuthorizerFn = new lambdaNodejs.NodejsFunction(this, 'BasicAuthorizer', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../src/authorization/basicAuthorizer.ts'),
            handler: 'main',
            bundling: { minify: true, target: 'es2020', sourceMap: false },
            environment: authorizerEnv,
            timeout: cdk.Duration.seconds(5),
            memorySize: 256,
            functionName: 'basic-authorizer',
        });
    }
}