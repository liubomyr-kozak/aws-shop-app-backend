# MyShop! App Deployment

## Links
- S3 Website URL: http://aws-practitioner-js-bucket-v1.s3-website-us-east-2.amazonaws.com/
- CloudFront URL: https://d2t7ay53fw9jwt.cloudfront.net/
- Auto deploy CloudFront URL https://d3omgmoj29znv9.cloudfront.net/

## Deployment Instructions
1. Build the app: `npm run build-app`
2. Synthesize template: `npm run cdk:synth`
2. Deploy the app: `npm run cdk:deploy`
3. Destroy infrastructure: `npm run cdk:destroy`

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
