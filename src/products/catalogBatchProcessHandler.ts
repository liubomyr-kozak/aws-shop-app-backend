import { SQSEvent } from "aws-lambda";
import { createProductTransaction } from "../utils";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

import 'dotenv/config';

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN as string;

// AWS passes all messages as an array in event.Records
export const catalogBatchProcess = async (event: SQSEvent) => {
  const createdProducts = [];

  for (const record of event.Records) {
    try {
      const { title, description, price, count } = JSON.parse(record.body);
      const id = await createProductTransaction({ title, description, price, count });
      createdProducts.push({ id, title, description, price, count });
    } catch (error) {
      console.error("Error processing record:", record, error);
      // Optionally handle failed records (e.g., DLQ)
    }
  }

  if (createdProducts.length > 0) {
    await sns.send(new PublishCommand({
      TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      Subject: "Batch Product Creation",
      Message: JSON.stringify({ products: createdProducts }),
    }));
  }
};