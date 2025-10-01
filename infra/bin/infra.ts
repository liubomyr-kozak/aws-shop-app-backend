#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductServiceStack } from '../lib/product-service-stack';

const app = new cdk.App();

new DeployWebAppStack(app, 'DeployWebAppStack', {
    env: { account: '410859982763', region: 'us-east-2' },
});

new ProductServiceStack(app, 'ProductServiceStack', {
    env: { account: '410859982763', region: 'us-east-2' },
});
