import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
interface DataStackProps extends cdk.StackProps {
    kmsKey: kms.Key;
}
export declare class DataStack extends cdk.Stack {
    readonly tables: {
        [key: string]: dynamodb.Table;
    };
    readonly buckets: {
        [key: string]: s3.Bucket;
    };
    constructor(scope: Construct, id: string, props: DataStackProps);
}
export {};
