import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
interface ApiStackProps extends cdk.StackProps {
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
}
export declare class ApiStack extends cdk.Stack {
    readonly httpApi: apigatewayv2.HttpApi;
    readonly webSocketApi: apigatewayv2.WebSocketApi;
    constructor(scope: Construct, id: string, props: ApiStackProps);
}
export {};
