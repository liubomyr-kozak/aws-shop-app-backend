import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentService } from './deployment-service';

export interface DeployWebAppStackProps extends cdk.StackProps {
    apiUrl: string;
}

export class DeployWebAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: DeployWebAppStackProps) {
        super(scope, id, props);

        new DeploymentService(this, 'DeploymentService', {
            apiUrl: props.apiUrl
        });
    }
}