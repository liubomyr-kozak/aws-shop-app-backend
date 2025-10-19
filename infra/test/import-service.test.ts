import { Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import { ImportServiceStack } from "../lib/import-service-stack";

describe("ImportServiceStack", () => {
  test("creates S3 bucket with proper configuration", () => {
    const app = new cdk.App();
    const stack = new ImportServiceStack(app, "TestImportServiceStack");
    const template = Template.fromStack(stack);

    // Verify S3 bucket is created
    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test("creates API Gateway with correct configuration", () => {
    const app = new cdk.App();
    const stack = new ImportServiceStack(app, "TestImportServiceStack");
    const template = Template.fromStack(stack);

    // Verify API Gateway is created
    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      Name: "Import Service",
    });

    // Verify import resource is created
    template.hasResourceProperties("AWS::ApiGateway::Resource", {
      PathPart: "import",
    });
  });

  test("creates Lambda functions with correct configuration", () => {
    const app = new cdk.App();
    const stack = new ImportServiceStack(app, "TestImportServiceStack");
    const template = Template.fromStack(stack);

    // Verify both Lambda functions are created
    template.resourceCountIs("AWS::Lambda::Function", 2);
  });

  test("exposes import API URL", () => {
    const app = new cdk.App();
    const stack = new ImportServiceStack(app, "TestImportServiceStack");

    expect(stack.importApiUrl).toBeDefined();
    expect(typeof stack.importApiUrl).toBe("string");
  });
});
