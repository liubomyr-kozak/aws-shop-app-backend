import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stocksTableName = process.env.STOCKS_TABLE_NAME as string;

export async function createProductTransaction({
  id = uuidv4(),
  title,
  description,
  price,
  count,
}: {
  id?: string;
  title: string;
  description: string;
  price: number;
  count: number;
}) {
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
          ConditionExpression: "attribute_not_exists(id)",
        }
      },
      {
        Put: {
          TableName: stocksTableName,
          Item: {
            product_id: { S: id },
            count: { N: count.toString() }
          },
          ConditionExpression: "attribute_not_exists(product_id)"
        }
      }
    ]
  }));
  return id;
}
