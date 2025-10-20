import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { getProducts } from '../src/products/productService';
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "us-east-1" });

async function seedProducts() {
  const products = await getProducts();
  const requestItems: Record<string, any[]> = {};
  requestItems["Products"] = products.map(product => ({
    PutRequest: {
      Item: {
        id: { S: uuidv4() },
        createdAt: { N: Date.now().toString() },
        title: { S: product.title },
        description: { S: product.description || '' },
        price: { N: product.price.toString() },
      }
    }
  }));

  await client.send(new BatchWriteItemCommand({
    RequestItems: requestItems
  }));
  console.log(`Seeded ${products.length} products.`);
}

seedProducts().then(() => console.log('Seeding complete')).catch(console.error);