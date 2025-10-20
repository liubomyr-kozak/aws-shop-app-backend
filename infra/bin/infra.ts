#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductsApiStack } from '../lib/api-products-stack';
import { ProductsDbStack } from '../lib/products-db-stack';
import { ImportServiceStack } from "../lib/import-service-stack";
import { CatalogSqs } from '../lib/sqs-catalog-stack';
import { ProductSnsStack } from '../lib/sns-products-stack';

const app = new cdk.App();
const dbStack = new ProductsDbStack(app, "ProductsDbStack");
const productsApiStack = new ProductsApiStack(app, 'ProductsApiStack', {
  productsTable: dbStack.productsTable,
  stocksTable: dbStack.stocksTable
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new ImportServiceStack(app, "ImportServiceStack", {
  api: productsApiStack.api
});

new CatalogSqs(app, "CatalogSqs");
new ProductSnsStack(app, "ProductSnsStack");