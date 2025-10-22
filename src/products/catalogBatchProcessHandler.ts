import { SQSEvent } from "aws-lambda";
import { createProductTransaction } from "../utils";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

import 'dotenv/config';

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN as string;

export const catalogBatchProcess = async (event: SQSEvent) => {
  const createdProducts = [];

  for (const record of event.Records) {
    try {
      const { title, description, price, count, category } = JSON.parse(record.body);
      const id = await createProductTransaction({ title, description, price, count });
      createdProducts.push({ id, title, description, price, count, category });
    } catch (error) {
      console.error("Error processing record:", record, error);
    }
  }

  if (createdProducts.length > 0) {
    const messageAttributes: { [key: string]: { DataType: string; StringValue?: string; NumberValue?: string } } = {};

    const totalProducts = createdProducts.length;
    const avgPrice = createdProducts.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts;
    const totalStock = createdProducts.reduce((sum, p) => sum + (p.count || 0), 0);
    const categories = [...new Set(createdProducts.map(p => p.category).filter(Boolean))];

    messageAttributes.price = {
      DataType: "Number",
      NumberValue: avgPrice.toString()
    };

    messageAttributes.count = {
      DataType: "Number",
      NumberValue: totalStock.toString()
    };

    if (categories.length > 0) {
      messageAttributes.category = {
        DataType: "String",
        StringValue: categories[0]
      };
    }

    messageAttributes.totalProducts = {
      DataType: "Number",
      NumberValue: totalProducts.toString()
    };

    await sns.send(new PublishCommand({
      TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      Subject: "Batch Product Creation",
      Message: JSON.stringify({
        products: createdProducts,
        summary: {
          totalProducts,
          averagePrice: avgPrice,
          totalStock,
          categories
        }
      }),
      MessageAttributes: messageAttributes
    }));

    console.log(`Successfully processed ${createdProducts.length} products and sent SNS notification`);
  }
};