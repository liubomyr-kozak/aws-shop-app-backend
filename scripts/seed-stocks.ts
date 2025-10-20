// Script to seed Stocks table with random counts for each product
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import 'dotenv/config';


const PRODUCTS_TABLE = 'Products';
const STOCKS_TABLE = 'Stocks';
const REGION = process.env.AWS_REGION || 'us-east-1';

const ddb = new DynamoDBClient({ region: REGION });

async function seedStocks() {
  // Scan Products table to get all product ids
  const products = await ddb.send(new ScanCommand({
    TableName: PRODUCTS_TABLE,
    ProjectionExpression: 'id',
  }));

  if (!products.Items) {
    console.log('No products found.');
    return;
  }

  for (const item of products.Items) {
    const productId = item.id?.S;
    if (!productId) {
      console.warn('Product item missing id:', item);
      continue;
    }
    const count = Math.floor(Math.random() * 10) + 1; // 1-10
    await ddb.send(new PutItemCommand({
      TableName: STOCKS_TABLE,
      Item: {
        product_id: { S: productId },
        count: { N: count.toString() },
      },
    }));
    console.log(`Seeded stock for product_id=${productId} with count=${count}`);
  }
}

seedStocks().catch(console.error);
