import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ITable } from "aws-cdk-lib/aws-dynamodb";


const ProductsTable = "Products";
const StocksTable = "Stocks";

interface LambdaStackProps extends cdk.StackProps {
  productsTable: ITable;
  stocksTable: ITable;
  importLambda?: lambda.IFunction;
  importAuthorizerFn?: lambda.IFunction;
}

export class ProductsApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

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
      code: lambda.Code.fromAsset("../dist", {
          exclude: ["cdk.out", "node_modules", ".git", "*.zip"],
      }),
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

    const productsResource = this.api.root.addResource("products");

    // TODO: Розкоментувати CORS налаштування при потребі
    // productsResource.addCorsPreflight({
    //   allowOrigins: [process.env.FRONTEND_ORIGIN || "localhost:3000"],
    //   allowMethods: ['GET', 'POST'],
    // });

    // Додаємо методи до /products ресурсу
    productsResource.addMethod("GET", productsLambdaIntegration);
    productsResource.addMethod("POST", createProductLambdaIntegration);

    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod("GET", productIdLambdaIntegration);

    // Optionally add /import endpoint if provided to avoid cross-stack cycles
    if (props.importLambda && props.importAuthorizerFn) {
      // Explicit permission for API Gateway to invoke the authorizer function, created in THIS stack
      const stack = cdk.Stack.of(this);
      const sourceArn = cdk.Fn.join('', [
        'arn:', stack.partition, ':execute-api:', stack.region, ':', stack.account, ':', this.api.restApiId, '/authorizers/*'
      ]);

      new lambda.CfnPermission(this, 'AllowApiGatewayInvokeAuthorizer', {
        action: 'lambda:InvokeFunction',
        functionName: props.importAuthorizerFn.functionArn,
        principal: 'apigateway.amazonaws.com',
        sourceArn,
      });

      // Create a low-level authorizer wired to the Lambda
      const authorizer = new apigateway.CfnAuthorizer(this, 'ImportBasicTokenAuthorizer', {
        name: 'ImportBasicTokenAuthorizer',
        type: 'TOKEN',
        restApiId: this.api.restApiId,
        identitySource: 'method.request.header.Authorization',
        authorizerResultTtlInSeconds: 0,
        authorizerUri: cdk.Fn.join('', [
          'arn:', stack.partition, ':apigateway:', stack.region, ':lambda:path/2015-03-31/functions/',
          props.importAuthorizerFn.functionArn,
          '/invocations'
        ]),
      });

      const importIntegration = new apigateway.LambdaIntegration(props.importLambda);
      const importResource = this.api.root.addResource("import");
      const importMethod = importResource.addMethod("GET", importIntegration, {
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      });

      const cfnImportMethod = importMethod.node.defaultChild as apigateway.CfnMethod;
      cfnImportMethod.authorizerId = authorizer.ref;
    }
  }
}