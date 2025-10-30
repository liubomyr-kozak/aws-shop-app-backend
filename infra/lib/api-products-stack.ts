// Filename: hello-lambda-stack.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ITable } from "aws-cdk-lib/aws-dynamodb";

const frontendOrigin = process.env.FRONTEND_ORIGIN || "localhost:3000";

const ProductsTable = "Products";
const StocksTable = "Stocks";

interface LambdaStackProps extends cdk.StackProps {
  productsTable: ITable; // pass from DatabaseStack
  stocksTable: ITable;
}

export class ProductsApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi; // Expose the API Gateway instance

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const productsLambda = new lambda.Function(this, 'getProductsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'products/getProductsListHandler.getProductsList',
      code: lambda.Code.fromAsset("../dist"), // compiled TS output
      environment: {
        FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "localhost:3000",
        PRODUCTS_TABLE_NAME: ProductsTable,
        STOCKS_TABLE_NAME: StocksTable
      },
    });

    props.productsTable.grantReadData(productsLambda);
    props.stocksTable.grantReadData(productsLambda);

    const productIdLambda = new lambda.Function(this, "getProductLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'products/getProductByIdHandler.getProductById',
      code: lambda.Code.fromAsset("../dist"), // compiled TS output
      environment: {
        FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "localhost:3000",
        PRODUCTS_TABLE_NAME: ProductsTable,
        STOCKS_TABLE_NAME: StocksTable
      },
    });

    props.productsTable.grantReadData(productIdLambda);
    props.stocksTable.grantReadData(productIdLambda);

    const createProductLambda = new lambda.Function(this, "createProductLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'products/createProductHandler.createProduct',
      code: lambda.Code.fromAsset("../dist"), // compiled TS output
      environment: {
        FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "localhost:3000",
        PRODUCTS_TABLE_NAME: ProductsTable,
        STOCKS_TABLE_NAME: StocksTable
      },
    });

    props.productsTable.grantWriteData(createProductLambda);
    props.stocksTable.grantWriteData(createProductLambda);

    this.api = new apigateway.RestApi(this, "my-api", {
      restApiName: "My API Gateway",
      description: "This API serves the products Lambda functions."
    });

    const productsLambdaIntegration = new apigateway.LambdaIntegration(productsLambda, {});
    const productIdLambdaIntegration = new apigateway.LambdaIntegration(productIdLambda, {});
    const createProductLambdaIntegration = new apigateway.LambdaIntegration(createProductLambda, {});

    // Create a resource /products and GET request under it
    const productsResource = this.api.root.addResource("products");
    // productsResource.addCorsPreflight({
    //   allowOrigins: [process.env.FRONTEND_ORIGIN || "localhost:3000"],
    //   allowMethods: ['GET'],
    // });

    productsResource.addMethod("GET", productsLambdaIntegration);
    productsResource.addMethod("POST", createProductLambdaIntegration);
    // productsResource.addCorsPreflight({
    //   allowOrigins: [process.env.FRONTEND_ORIGIN || "localhost:3000"],
    //   allowMethods: ['GET'],
    // });

    // Create a resource /products/{productId} and GET request under it
    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod("GET", productIdLambdaIntegration);

  }
}