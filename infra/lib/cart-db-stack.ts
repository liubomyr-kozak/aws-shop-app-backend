import { Stack, StackProps, RemovalPolicy, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class CartDbStack extends Stack {
  public readonly vpc: ec2.IVpc;
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.ISecret;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC for RDS
    this.vpc = new ec2.Vpc(this, 'CartVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security group for RDS
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'CartDbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Cart RDS instance',
      allowAllOutbound: true,
    });

    // Lambda security group (created here to avoid circular dependency)
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'CartLambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Cart Lambda function',
      allowAllOutbound: true,
    });

    // Allow Lambda to access RDS
    this.dbSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access RDS',
    );

    // Create DB secret
    this.dbSecret = new secretsmanager.Secret(this, 'CartDbSecret', {
      secretName: 'cart-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'cartadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 16,
      },
    });

    // Create RDS PostgreSQL instance
    this.dbInstance = new rds.DatabaseInstance(this, 'CartDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: 'cartdb',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      publiclyAccessible: false,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      backupRetention: Duration.days(7),
    });

    // Outputs
    new CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'Cart Database Endpoint',
      exportName: 'CartDbEndpoint',
    });

    new CfnOutput(this, 'DbSecretArn', {
      value: this.dbSecret.secretArn,
      description: 'Cart Database Secret ARN',
      exportName: 'CartDbSecretArn',
    });

    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'Cart VPC ID',
      exportName: 'CartVpcId',
    });
  }
}
