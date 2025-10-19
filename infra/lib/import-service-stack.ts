import {
  Stack,
  RemovalPolicy,
  StackProps,
  Duration,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cdk from "aws-cdk-lib";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

interface LambdaStackProps extends StackProps {
  api: cdk.aws_apigateway.RestApi;
}

export class ImportServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, "ImportBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, "DeployUploadedFolder", {
      destinationBucket: importBucket,
      destinationKeyPrefix: "uploaded/",
      sources: [
        s3deploy.Source.data("placeholder.txt", "This is a placeholder file."),
      ],
    });

    const importProductsFileLambda = new lambda.Function(
      this,
      "importProductsFileLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "importProducts/importProductsFileHandler.importProductsFile",
        code: lambda.Code.fromAsset("../dist"),
        environment: {
          IMPORT_BUCKET_NAME: importBucket.bucketName,
        },
      }
    );

    const importFileParserLambda = new lambda.Function(
      this,
      "importFileParserLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: Duration.seconds(10),
        handler: "importProducts/importFileParserHandler.importFileParser",
        code: lambda.Code.fromAsset("../dist"),
        environment: {
          IMPORT_BUCKET_NAME: importBucket.bucketName,
        },
        events: [],
      }
    );

    importBucket.grantReadWrite(importProductsFileLambda);
    importBucket.grantRead(importFileParserLambda);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );

    const importResource = props.api.root.addResource("import");
    const importProductsFileIntegration = new apigateway.LambdaIntegration(
      importProductsFileLambda,
      {}
    );

    importResource.addMethod("GET", importProductsFileIntegration);

    new CfnOutput(this, "ImportBucketName", {
      value: importBucket.bucketName,
      description:
        "The name of the S3 bucket for the import service for uploading files",
    });
  }
}
