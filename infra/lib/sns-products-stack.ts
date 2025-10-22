// Filename: product-sns-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

import 'dotenv/config';

export class ProductSnsStack extends cdk.Stack {
  public readonly productTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const notificationEmail = process.env.EMAIL;

    if (!notificationEmail) {
      throw new Error('Please provide EMAIL environment variable in your .env file');
    }

    this.productTopic = new sns.Topic(this, "product-topic", {
      topicName: "createProductTopic"
    });



    // Add primary email subscription (receives all notifications)
    this.productTopic.addSubscription(
      new subscriptions.EmailSubscription(notificationEmail)
    );

    // Add filtered email subscription for expensive products (price > 50)
    this.productTopic.addSubscription(
      new subscriptions.EmailSubscription(`expensive-${notificationEmail}`, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThan: 50
          })
        }
      })
    );

    // Add filtered email subscription for high-stock products (count > 100)
    this.productTopic.addSubscription(
      new subscriptions.EmailSubscription(`high-stock-${notificationEmail}`, {
        filterPolicy: {
          count: sns.SubscriptionFilter.numericFilter({
            greaterThan: 100
          })
        }
      })
    );

    // Add filtered email subscription for specific product category
    this.productTopic.addSubscription(
      new subscriptions.EmailSubscription(`electronics-${notificationEmail}`, {
        filterPolicy: {
          category: sns.SubscriptionFilter.stringFilter({
            allowlist: ['electronics', 'gadgets']
          })
        }
      })
    );
  }
}