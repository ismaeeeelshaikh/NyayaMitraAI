import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
interface ComputeStackProps extends cdk.StackProps {
    tables: {
        [key: string]: dynamodb.Table;
    };
    buckets: {
        [key: string]: s3.Bucket;
    };
    httpApi: apigatewayv2.HttpApi;
    webSocketApi: apigatewayv2.WebSocketApi;
}
export declare class ComputeStack extends cdk.Stack {
    readonly lambdas: {
        [key: string]: lambda.Function;
    };
    constructor(scope: Construct, id: string, props: ComputeStackProps);
}
export {};
