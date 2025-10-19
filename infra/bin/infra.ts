import { ProductsApiStack } from "../lib/api-products-stack";
import { ProductsDbStack } from "../lib/products-db-stack";
import { ImportServiceStack } from "../lib/import-service-stack";

const app = new cdk.App();
const dbStack = new ProductsDbStack(app, "ProductsDbStack");
const productsApiStack = new ProductsApiStack(app, "ProductsApiStack", {
  productsTable: dbStack.productsTable,
  stocksTable: dbStack.stocksTable,
});

new ImportServiceStack(app, "ImportServiceStack", {
  api: productsApiStack.api,
});
