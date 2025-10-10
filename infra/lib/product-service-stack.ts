import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================
    // DynamoDB Tables
    // =========================

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "products",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(this, "StockTable", {
      tableName: "stock",
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // ⚠️ лише для дев/навчання
    });

    // =========================
    // Lambdas
    // =========================

    const lambdaCode = lambda.Code.fromAsset("../lambda"); // ← перевір шлях

    const getProductsListLambda = new lambda.Function(
      this,
      "GetProductsListFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "getProductsList.handler",
        code: lambdaCode,
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
        timeout: cdk.Duration.seconds(10),
      }
    );

    const getProductsByIdLambda = new lambda.Function(
      this,
      "GetProductsByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "getProductsById.handler",
        code: lambdaCode,
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
        timeout: cdk.Duration.seconds(10),
      }
    );

    const createProductLambda = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "createProduct.handler",
        code: lambdaCode,
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
        timeout: cdk.Duration.seconds(10),
      }
    );

    const deleteProductLambda = new lambda.Function(
      this,
      "DeleteProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "deleteProduct.handler",
        code: lambdaCode,
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
        timeout: cdk.Duration.seconds(10),
      }
    );

    productsTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductsListLambda);

    productsTable.grantReadData(getProductsByIdLambda);
    stockTable.grantReadData(getProductsByIdLambda);

    productsTable.grantReadWriteData(createProductLambda);
    stockTable.grantReadWriteData(createProductLambda);

    productsTable.grantReadWriteData(deleteProductLambda);
    stockTable.grantReadWriteData(deleteProductLambda);

    // =========================
    // API Gateway
    // =========================
    const api = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service API",
      description: "API for Product Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
      },
    });

    this.apiUrl = api.url;

    const products = api.root.addResource("products");
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLambda)
    );
    products.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductLambda)
    );

    // /products/{productId}
    const productById = products.addResource("{productId}");
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLambda)
    );
    productById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteProductLambda)
    );

    // =========================
    // Outputs
    // =========================
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "Product Service API URL",
    });
    new cdk.CfnOutput(this, "ProductsTableName", {
      value: productsTable.tableName,
      description: "Products table name",
    });
    new cdk.CfnOutput(this, "StockTableName", {
      value: stockTable.tableName,
      description: "Stock table name",
    });

    // =========================
    // CloudWatch Alarms (базові)
    // =========================
    new cloudwatch.Alarm(this, "ProductsListErrorAlarm", {
      metric: getProductsListLambda.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: "Alert when getProductsList has too many errors",
    });

    new cloudwatch.Alarm(this, "CreateProductErrorAlarm", {
      metric: createProductLambda.metricErrors(),
      threshold: 3,
      evaluationPeriods: 2,
      alarmDescription: "Alert when createProduct has too many errors",
    });

    new cloudwatch.Alarm(this, "DeleteProductErrorAlarm", {
      metric: deleteProductLambda.metricErrors(),
      threshold: 3,
      evaluationPeriods: 2,
      alarmDescription: "Alert when deleteProduct has too many errors",
    });
  }
}
