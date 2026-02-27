import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';
interface OpsStackProps extends cdk.StackProps {
    httpApi: apigatewayv2.HttpApi;
}
export declare class OpsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: OpsStackProps);
}
export {};
