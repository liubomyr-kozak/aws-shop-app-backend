
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class CatalogSqs extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DLQ: Messages that failed to be processed on multiple retries are moved to dead-letter queue (DLQ)
    // const dlq = new sqs.Queue(this, 'DLQ');
    const catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
      // deadLetterQueue: {
      //   maxReceiveCount: 3,
      //   queue: dlq,
      // },
      // avoid possible duplications
      queueName: "catalog-items-queue.fifo",
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(30),
    });


    const catalogBatchProcessLambda = new lambda.Function(this, "catalogBatchProcessLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'products/catalogBatchProcessHandler.catalogBatchProcess',
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      environment: {
        CATALOG_QUEUE_URL: catalogItemsQueue.queueUrl
      }
    });

    catalogBatchProcessLambda.addEventSource(new SqsEventSource(catalogItemsQueue, {
      batchSize: 5
    }));
  }
}