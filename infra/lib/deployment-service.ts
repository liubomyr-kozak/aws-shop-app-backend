import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_s3,
  aws_s3_deployment,
  CfnOutput,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";

const path_to_build_folder = "../dist";

export interface DeploymentServiceProps {
  apiUrl: string;
}

export class DeploymentService extends Construct {
  constructor(scope: Construct, id: string, props: DeploymentServiceProps) {
    super(scope, id);

    const hostingBucket = new aws_s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const distribution = new aws_cloudfront.Distribution(
      this,
      "CloudfrontDistribution",
      {
        defaultBehavior: {
          origin:
            aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              hostingBucket
            ),
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors: {
          "/config.json": {
            origin:
              aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
                hostingBucket
              ),
            viewerProtocolPolicy:
              aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
          },
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    new aws_s3_deployment.BucketDeployment(this, "BucketDeployment", {
      sources: [aws_s3_deployment.Source.asset(path_to_build_folder)],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    const apiBaseUrl = props.apiUrl.replace(/\/$/, ""); // Remove trailing slash
    const configContent = JSON.stringify(
      {
        PRODUCT_API_BASE: apiBaseUrl,
      },
      null,
      2
    );

    new aws_s3_deployment.BucketDeployment(this, "ConfigDeployment", {
      sources: [aws_s3_deployment.Source.data("config.json", configContent)],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ["/config.json"],
      contentType: "application/json",
      cacheControl: [
        aws_s3_deployment.CacheControl.noStore(),
        aws_s3_deployment.CacheControl.noCache(),
        aws_s3_deployment.CacheControl.mustRevalidate(),
      ],
    });

    new CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "The distribution URL",
      exportName: "CloudfrontURL",
    });

    new CfnOutput(this, "BucketName", {
      value: hostingBucket.bucketName,
      description: "The name of the S3 bucket",
      exportName: "BucketName",
    });

    new CfnOutput(this, "ConfigUrl", {
      value: `https://${distribution.domainName}/config.json`,
      description: "The config.json URL",
      exportName: "ConfigUrl",
    });
  }
}
