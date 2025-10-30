# cloudx-shop-be
backend for cloudx course

to see your region `cat ~/.aws/config`

This command sets up a new CDK project using TypeScript

`cdk init --language typescript`

# Synthesize

The 'cdk synth' command stands for 'synthesize', which means it takes your CDK app's code and converts, or 'synthesizes', it into a CloudFormation template. 
This synthesis process allows AWS CDK to deploy your resources in a manner understandable by AWS CloudFormation.

If your app contains more than one stack, you must specify which stacks to synthesize

`cdk synth`

If you want your synthesized CloudFormation template to reside in a file, you could redirect the output to a file like this:

`cdk synth > MyStack.template.json`

If you don't run cdk synth, the CDK CLI will automatically perform this step when you deploy. You do not have to run synth manually; just use `cdk deploy` to deploy your stacks, and CDK will synthesize them automatically.

# Bootstrap

Before deployment, you must perform a one-time bootstrapping of your AWS environment.
If it’s your first time deploying, bootstrap your CDK environment

Bootstraping is needed
- Setup Required Resources 
- Permissions Setup
- Environment Setup
- Environment Setup
- Uniformity

`cdk bootstrap aws://ACCOUNT-NUMBER/REGION` //  npx aws-cdk bootstrap if you didnt create script in package.json


# Deploy  https://ebook.learn.epam.com/cloudx-aws/docs/serving-frontend-app/deploy_frontend_app_with_aws_cdk#step-13-deploy-your-stack

before deploying you have to build it as files are written in ts. You need to build first

`npm run build`
`cdk deploy`

who am i: `aws sts get-caller-identity`

"If your application contains several stacks, you need to specify which stack you want to deploy."

# swagger

when you did changes on handlers you should generate swagger

`npm run generate:swagger`

to start swagger you should start api locally

`npm run start-api`

and then serve swagger

`npm serve:swagger`


# seed database

`ts-node scripts/seed-products.ts`

some questions:
1. how do you do local development with lambdas?
2. how do you setup esbuild?
3. If I want to have few different projects on same aws account? How could I isolate things between projects? Are tags only solution? This seems messy to me.
4. is it ok to leave model scheme only with must ids as dynamo db is schemaless or we should add all props?
5. why nosql is used as relational databases with joins and things?
6. why sortKey is used for?
7. what does this mean "All lambdas log incoming requests and their arguments"
8. what is meant by "An RDS instance was used instead of DynamoDB (with proper security practices), and environment variables were not committed to GitHub"? Shouldnt we use dynamo here?
9. how to make swagger works now when we are using dynamo db and lambdas has to connect to aws dynamo? How we cann make swagger works locally?



