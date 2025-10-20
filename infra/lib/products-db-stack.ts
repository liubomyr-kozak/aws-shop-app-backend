import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class ProductsDbStack extends Stack {
  public readonly productsTable: Table;
  public readonly stocksTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.productsTable = new Table(this, 'ProductsTable', {
      tableName: 'Products',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      // sortKey: { name: 'createdAt', type: AttributeType.NUMBER },
      // removalPolicy: RemovalPolicy.DESTROY, // Set to RemovalPolicy.DESTROY for dev, RETAIN for prod
    });
    // DynamoDB is schemaless: only the primary and sort keys are enforced by the table.
    // You can store any attributes in each item. For the Product model, each item should have:
    // title: string (not null)
    // description: string (optional)
    // price: number (integer)

    this.stocksTable = new Table(this, 'StocksTable', {
      partitionKey: { name: 'product_id', type: AttributeType.STRING },
      tableName: 'Stocks',
      // Instead, update your CDK code (removalPolicy: cdk.RemovalPolicy.DESTROY) and redeploy, or run cdk destroy.
      // removalPolicy: undefined, // Set to RemovalPolicy.DESTROY for dev, RETAIN for prod
    });
    // DynamoDB is schemaless: only the primary key is enforced by the table.
    // Each stock item should have:
    // product_id: string (uuid, foreign key from products.id)
    // count: number (integer, total number of products in stock)
  }
}
