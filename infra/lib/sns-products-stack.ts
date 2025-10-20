// Filename: product-sns-stack.ts
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SnsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

const notificationEmail = process.env.EMAIL as string;

export class ProductSnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTopic = new sns.Topic(this, "product-topic", {
      topicName: "createProductTopic"
    });


    if (!notificationEmail) {
      throw new Error('Please provide context variable "notificationEmail"');
    }

    // Add email subscription
    productTopic.addSubscription(
      new subscriptions.EmailSubscription(notificationEmail)
    );

    const lambdaFunction = new lambda.Function(this, "sns-lambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'products/catalogBatchProcessHandler.catalogBatchProcess',
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      environment: {
        EMAIL: notificationEmail,
        CREATE_PRODUCT_TOPIC_ARN: productTopic.topicArn
      }
    });

    // Grant Lambda permission to publish to the topic
    productTopic.grantPublish(lambdaFunction);

    lambdaFunction.addEventSource(new SnsEventSource(productTopic));
  }
}