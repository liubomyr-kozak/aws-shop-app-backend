#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductServiceStack } from '../lib/product-service-stack';

const app = new cdk.App();

const envUsEast2 = { account: "410859982763", region: "us-east-2" };

// Create ProductServiceStack first to get API URL
const productServiceStack = new ProductServiceStack(app, "ProductServiceStack", { env: envUsEast2 });

// Create DeployWebAppStack and pass API URL from ProductServiceStack
new DeployWebAppStack(app, "DeployWebAppStack", {
  env: envUsEast2,
  apiUrl: productServiceStack.apiUrl
});
