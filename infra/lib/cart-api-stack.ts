import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface CartApiStackProps extends StackProps {
  vpc: ec2.IVpc;
  dbSecret: secretsmanager.ISecret;
  lambdaSecurityGroup: ec2.SecurityGroup;
  dbEndpoint: string;
}

export class CartApiStack extends Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunction: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: CartApiStackProps) {
    super(scope, id, props);

    // Lambda function
    this.lambdaFunction = new lambdaNodejs.NodejsFunction(this, 'CartLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: '../cart-service/src/lambda.ts',
      handler: 'handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.lambdaSecurityGroup],
      environment: {
        DB_HOST: props.dbEndpoint,
        DB_PORT: '5432',
        DB_NAME: 'cartdb',
        DB_USERNAME: 'cartadmin',
        DB_SYNCHRONIZE: 'true',
        DB_LOGGING: 'false',
      },
      bundling: {
        externalModules: [
          'pg-native',
          '@nestjs/websockets',
          '@nestjs/microservices',
          'class-transformer',
          'class-validator',
          'cache-manager',
        ],
        minify: false,
        sourceMap: true,
      },
    });

    // Grant Lambda access to the secret
    props.dbSecret.grantRead(this.lambdaFunction);

    // Add DB_PASSWORD from secret
    this.lambdaFunction.addEnvironment(
      'DB_SECRET_ARN',
      props.dbSecret.secretArn,
    );

    // Update lambda to fetch password from secret
    const secretValue = props.dbSecret.secretValueFromJson('password');
    this.lambdaFunction.addEnvironment('DB_PASSWORD', secretValue.unsafeUnwrap());

    // API Gateway
    this.api = new apigateway.RestApi(this, 'CartApi', {
      restApiName: 'Cart Service',
      description: 'This service serves a NestJS cart application',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-User-Id',
        ],
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      proxy: true,
    });

    // Add proxy resource to catch all routes
    this.api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Outputs
    new CfnOutput(this, 'CartApiUrl', {
      value: this.api.url,
      description: 'Cart API Gateway URL',
      exportName: 'CartApiUrl',
    });

    new CfnOutput(this, 'CartLambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Cart Lambda Function Name',
      exportName: 'CartLambdaFunctionName',
    });
  }
}
