import type { APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stocksTableName = process.env.STOCKS_TABLE_NAME as string;

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Returns a list of products
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123"
 *                   title:
 *                     type: string
 *                     example: "Laptop"
 *                   price:
 *                     type: number
 *                     example: 999.99
 *                   description:
 *                      type: string
 *                      example: "laptop for coding"
 *                   count:
 *                      type: number
 *                      example: 30
 */
export async function getProductsList(): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({ TableName: productsTableName })
    );

    const stocks = await dynamoDB.send(
      new ScanCommand({ TableName: stocksTableName })
    );

    const products = (result.Items || []).map(item => {
      const productId = item.id?.S ?? '';
      const stock = (stocks.Items || []).find(stockItem => stockItem.product_id?.S === productId);
      return {
        id: productId,
        title: item.title?.S ?? '',
        price: item.price?.N ? Number(item.price.N) : 0,
        description: item.description?.S ?? '',
        count: stock?.count?.N ? Number(stock.count.N) : 0
      };
    });
    return {
      body: JSON.stringify(products),
      statusCode: 200,
    };
  } catch (err) {
    console.error("Lambda error:", err);  // Logs full stack
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    };
  }
}