import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3lib from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for import service
    const bucket = new s3lib.Bucket(this, "ImportBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3lib.BlockPublicAccess.BLOCK_ALL,
      encryption: s3lib.BucketEncryption.S3_MANAGED,
    });

    // Create uploaded/ prefix by placing a zero-byte placeholder
    // NOTE: replace `bucket` with your actual bucket variable name if different.
    new AwsCustomResource(this, "CreateUploadedPrefixObject", {
      onCreate: {
        service: "S3",
        action: "putObject",
        parameters: {
          Bucket: bucket.bucketName,
          Key: "uploaded/.gitkeep",
          Body: "",
          ContentType: "text/plain",
        },
        physicalResourceId: PhysicalResourceId.of(
          "UploadedPrefixPlaceholder-v1"
        ),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [bucket.arnForObjects("uploaded/*")],
      }),
    });

    // Lambda: importProductsFile -> returns signed PUT URL for uploaded/${fileName}
    const importProductsFileFn = new NodejsFunction(
      this,
      "ImportProductsFileFn",
      {
        entry: path.join(__dirname, "..", "lambda", "importProductsFile.ts"),
        handler: "handler",
        runtime: Runtime.NODEJS_18_X,
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
        bundling: {
          minify: true,
          externalModules: [],
          sourceMap: true,
        },
      }
    );

    // Allow presigned URL to authorize PutObject into uploaded/*
    bucket.grantPut(importProductsFileFn, "uploaded/*");

    // API Gateway: GET /import -> importProductsFile
    const api = new apigw.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service",
      deployOptions: { stageName: "prod" },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });
    const importRes = api.root.addResource("import");
    importRes.addMethod(
      "GET",
      new apigw.LambdaIntegration(importProductsFileFn, { proxy: true })
    );

    // Lambda: importFileParser -> triggered by S3 "uploaded/" object created
    const importFileParserFn = new NodejsFunction(this, "ImportFileParserFn", {
      entry: path.join(__dirname, "..", "lambda", "importFileParser.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      bundling: {
        minify: true,
        externalModules: [],
        sourceMap: true,
      },
    });

    // Permissions for parser to read, copy, delete objects
    bucket.grantReadWrite(importFileParserFn);

    // S3 event notification for "uploaded/" prefix
    bucket.addEventNotification(
      s3lib.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFn),
      { prefix: "uploaded/" }
    );

    // Explicit IAM condition to restrict presign to prefix (defense-in-depth)
    importProductsFileFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [bucket.arnForObjects("uploaded/*")],
      })
    );

    new cdk.CfnOutput(this, "ImportApiUrl", {
      value: api.url ?? "",
      description: "Base URL for Import Service API",
    });
    new cdk.CfnOutput(this, "ImportBucketName", {
      value: bucket.bucketName,
    });
  }
}
