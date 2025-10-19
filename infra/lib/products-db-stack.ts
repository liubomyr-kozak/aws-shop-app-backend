import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";

export class ProductsDbStack extends Stack {
  public readonly productsTable: Table;
  public readonly stocksTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.productsTable = new Table(this, "ProductsTable", {
      tableName: "Products",
      partitionKey: { name: "id", type: AttributeType.STRING },
    });

    this.stocksTable = new Table(this, "StocksTable", {
      partitionKey: { name: "product_id", type: AttributeType.STRING },
      tableName: "Stocks",
    });
  }
}
