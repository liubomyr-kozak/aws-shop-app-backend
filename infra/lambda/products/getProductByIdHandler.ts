import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stocksTableName = process.env.STOCKS_TABLE_NAME as string;

export async function getProductById(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product ID is required" }),
      };
    }

    let productResult;
    try {
      productResult = await dynamoDB.send(
        new GetItemCommand({
          TableName: productsTableName,
          Key: { id: { S: productId } },
        })
      );
    } catch (err) {
      console.error("Error fetching product from DynamoDB:", err);
      throw err;
    }

    const productItem = productResult.Item;
    if (!productItem) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    let stockResult;
    try {
      stockResult = await dynamoDB.send(
        new GetItemCommand({
          TableName: stocksTableName,
          Key: { product_id: { S: productId } },
        })
      );
    } catch (err) {
      console.error("Error fetching stock from DynamoDB:", err);
      throw err;
    }

    const stockItem = stockResult.Item;

    let stockCount = null;
    if (stockItem) {
      stockCount = stockItem?.count?.N ? Number(stockItem.count.N) : 0;
    }

    const product = {
      id: productItem.id?.S ?? "",
      title: productItem.title?.S ?? "",
      price: productItem.price?.N ? Number(productItem.price.N) : 0,
      description: productItem.description?.S ?? "",
      count: stockCount,
    };
    return {
      body: JSON.stringify(product),
      statusCode: 200,
    };
  } catch (err) {
    console.error("Lambda error:", err);
    if (err instanceof Error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: err.message,
          stack: err.stack,
          event: event,
        }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    };
  }
}
