import type { Handler } from "aws-lambda";
import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stocksTableName = process.env.STOCKS_TABLE_NAME as string;

export const createProduct: Handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { title, description, price, count } = body;

    // todo: add zod for validation
    if (!title || !price || !count || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "title, price, description and count are required" }),
      };
    }

    if (typeof price !== "number" || typeof count !== "number" || typeof title !== "string" || typeof description !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid fields" }),
      };
    }

    const id = uuidv4();

    await dynamoDB.send(new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: productsTableName,
            Item: {
              id: { S: id },
              title: { S: title },
              description: { S: description ?? "" },
              createdAt: { N: Date.now().toString() },
              price: { N: price.toString() }
            },
            ConditionExpression: "attribute_not_exists(id)", // avoid overwriting
          }
        },
        {
          Put: {
            TableName: stocksTableName,
            Item: {
              product_id: { S: id },
              count: { N: count.toString() }
            },
            ConditionExpression: "attribute_not_exists(product_id)" // optional safety
          }
        }
      ]
    }));

    return {
      statusCode: 201,
      body: JSON.stringify({ id, title, description, price, count }),
    };
  } catch (err) {
    console.error("Create product error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    };
  }
};