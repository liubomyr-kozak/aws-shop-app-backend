#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductsApiStack } from '../lib/api-products-stack';
import { ProductsDbStack } from '../lib/products-db-stack';
import { ImportServiceStack } from "../lib/import-service-stack";
import { CatalogSqs } from '../lib/sqs-catalog-stack';
import { ProductSnsStack } from '../lib/sns-products-stack';
import { AuthorizationServiceStack } from "../lib/authorization-service";
import { CartDbStack } from '../lib/cart-db-stack';
import { CartApiStack } from '../lib/cart-api-stack';

import 'dotenv/config';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION
};

const authStack = new AuthorizationServiceStack(app, 'AuthorizationServiceStack', { env });

const dbStack = new ProductsDbStack(app, "ProductsDbStack", { env });

const productSnsStack = new ProductSnsStack(app, "ProductSnsStack", { env });

const catalogSqsStack = new CatalogSqs(app, "CatalogSqs", {
  productTopic: productSnsStack.productTopic,
  env
});

const importServiceStack = new ImportServiceStack(app, "ImportServiceStack", {
  catalogItemsQueue: catalogSqsStack.catalogItemsQueue,
  env
});

const productsApiStack = new ProductsApiStack(app, 'ProductsApiStack', {
  productsTable: dbStack.productsTable,
  stocksTable: dbStack.stocksTable,
  importLambda: importServiceStack.importProductsFileLambda,
  // @ts-ignore - function type compatibility
  importAuthorizerFn: authStack.basicAuthorizerFn,
  env
});

// Cart Service Stacks
const cartDbStack = new CartDbStack(app, 'CartDbStack', { env });

const cartApiStack = new CartApiStack(app, 'CartApiStack', {
  vpc: cartDbStack.vpc,
  dbSecret: cartDbStack.dbSecret,
  lambdaSecurityGroup: cartDbStack.lambdaSecurityGroup,
  dbEndpoint: cartDbStack.dbInstance.dbInstanceEndpointAddress,
  env
});
