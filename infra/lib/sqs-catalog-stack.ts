import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface CatalogSqsProps extends cdk.StackProps {
  productTopic: sns.Topic;
}

export class CatalogSqs extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: CatalogSqsProps) {
    super(scope, id, props);

    // DLQ: Messages that failed to be processed on multiple retries are moved to dead-letter queue (DLQ)
    // const dlq = new sqs.Queue(this, 'DLQ');
    this.catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
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
      code: lambda.Code.fromAsset("../dist"),
      environment: {
        CATALOG_QUEUE_URL: this.catalogItemsQueue.queueUrl,
        CREATE_PRODUCT_TOPIC_ARN: props.productTopic.topicArn
      }
    });

    catalogBatchProcessLambda.addEventSource(new SqsEventSource(this.catalogItemsQueue, {
      batchSize: 5
    }));

    // Grant permissions
    this.catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);
    props.productTopic.grantPublish(catalogBatchProcessLambda);
  }
}