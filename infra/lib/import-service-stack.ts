import { Stack, RemovalPolicy, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cdk from 'aws-cdk-lib';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';

interface LambdaStackProps extends StackProps {
  api: cdk.aws_apigateway.RestApi;
  catalogItemsQueue: sqs.Queue;
  basicAuthorizerFn: lambda.IFunction;
}



export class ImportServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);



    // Create S3 bucket for upload
    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // these two are for dev only. update these
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Optional: Automatically delete objects when the bucket is destroyed
    });

    new s3deploy.BucketDeployment(this, 'DeployUploadedFolder', {
      destinationBucket: importBucket,
      destinationKeyPrefix: 'uploaded/', // This creates the 'uploaded' folder
      sources: [s3deploy.Source.data('placeholder.txt', 'This is a placeholder file.')],
    });

    const importProductsFileLambda = new lambda.Function(this, "importProductsFileLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: Duration.seconds(5),
      handler: 'importProducts/importProductsFileHandler.importProductsFile',
      code: lambda.Code.fromAsset("../dist"), // compiled TS output
      environment: {
        IMPORT_BUCKET_NAME: importBucket.bucketName,
      },
    });

    // Lambda to parse imported files, triggered by S3 event
    const importFileParserLambda = new lambda.Function(this, "importFileParserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: Duration.seconds(10),
      handler: 'importProducts/importFileParserHandler.importFileParser', // Adjust the handler path as needed
      code: lambda.Code.fromAsset("../dist"),
      environment: {
        IMPORT_BUCKET_NAME: importBucket.bucketName,
        CATALOG_QUEUE_URL: props.catalogItemsQueue.queueUrl,
      },
      events: [],
    });

    importBucket.grantReadWrite(importProductsFileLambda);
    importBucket.grantRead(importFileParserLambda);


    const tokenAuthorizer = new apigateway.TokenAuthorizer(this, 'ImportBasicTokenAuthorizer', {
      handler: props.basicAuthorizerFn,
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    // Grant SQS permissions to importFileParser lambda
    props.catalogItemsQueue.grantSendMessages(importFileParserLambda);

     // Add S3 event notification for the 'uploaded/' prefix
     importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' }
    );

    const importResource = props.api.root.addResource("import");
    const importProductsFileIntegration = new apigateway.LambdaIntegration(importProductsFileLambda);

    importResource.addMethod("GET", importProductsFileIntegration, {
      authorizer: tokenAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // Add a folder named 'uploaded' (folders in S3 are virtual, so no explicit creation is needed)
    new CfnOutput(this, 'ImportBucketName', {
      value: importBucket.bucketName,
      description: 'The name of the S3 bucket for the import service for uploading files',
    });

  }
}