import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

import 'dotenv/config';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stocksTableName = process.env.STOCKS_TABLE_NAME as string;

/**
 * @openapi
 * /products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     description: Returns a single product by its ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to retrieve
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123"
 *                 title:
 *                   type: string
 *                   example: "Laptop"
 *                 price:
 *                   type: number
 *                   example: 999.99
 *                 description:
 *                   type: string
 *                   example: "laptop for coding"
 *                 count:
 *                   type: number
 *                   example: 30
 *       '404':
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 */
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
          Key: { id: { S: productId } }
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
          Key: { product_id: { S: productId } }
        })
      );
    } catch (err) {
      console.error("Error fetching stock from DynamoDB:", err);
      throw err;
    }

    const stockItem = stockResult.Item;

    let stockCount = null;
    if (stockItem) {
      stockCount = stockItem?.count?.N ? Number(stockItem.count.N) : 0
    }

    const product = {
      id: productItem.id?.S ?? '',
      title: productItem.title?.S ?? '',
      price: productItem.price?.N ? Number(productItem.price.N) : 0,
      description: productItem.description?.S ?? '',
      count: stockCount
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
        body: JSON.stringify({ message: err.message, stack: err.stack, event: event }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    };
  }
}