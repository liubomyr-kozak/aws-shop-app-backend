#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductsApiStack } from '../lib/api-products-stack';
import { ProductsDbStack } from '../lib/products-db-stack';
import { ImportServiceStack } from "../lib/import-service-stack";
import { CatalogSqs } from '../lib/sqs-catalog-stack';
import { ProductSnsStack } from '../lib/sns-products-stack';

import 'dotenv/config';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION
};

const dbStack = new ProductsDbStack(app, "ProductsDbStack", { env });

const productsApiStack = new ProductsApiStack(app, 'ProductsApiStack', {
  productsTable: dbStack.productsTable,
  stocksTable: dbStack.stocksTable,
  env
});

const productSnsStack = new ProductSnsStack(app, "ProductSnsStack", { env });

const catalogSqsStack = new CatalogSqs(app, "CatalogSqs", {
  productTopic: productSnsStack.productTopic,
  env
});

const importStack = new ImportServiceStack(app, "ImportServiceStack", {
  api: productsApiStack.api,
  catalogItemsQueue: catalogSqsStack.catalogItemsQueue,
  env
});
