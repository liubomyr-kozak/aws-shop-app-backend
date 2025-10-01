import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create Lambda function for getProductsList
        const getProductsListLambda = new lambda.Function(this, "GetProductsListFunction", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "getProductsList.handler",
            code: lambda.Code.fromAsset("lambda"),
            functionName: "getProductsList",
        });

        // Create Lambda function for getProductsById
        const getProductsByIdLambda = new lambda.Function(this, "GetProductsByIdFunction", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "getProductsById.handler",
            code: lambda.Code.fromAsset("lambda"),
            functionName: "getProductsById",
        });

        // Create API Gateway
        const api = new apigateway.RestApi(this, "ProductServiceApi", {
            restApiName: "Product Service API",
            description: "API for Product Service",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
            },
        });

        // Create /products resource and integrate with Lambda
        const products = api.root.addResource("products");
        products.addMethod("GET", new apigateway.LambdaIntegration(getProductsListLambda));

        // Create /products/{productId} resource and integrate with Lambda
        const productById = products.addResource("{productId}");
        productById.addMethod("GET", new apigateway.LambdaIntegration(getProductsByIdLambda));

        // Output the API URL
        new cdk.CfnOutput(this, "ApiUrl", {
            value: api.url,
            description: "Product Service API URL",
        });
    }
}


