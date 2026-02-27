import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
export declare class SecurityStack extends cdk.Stack {
    readonly kmsKey: kms.Key;
    readonly escalationTopic: sns.Topic;
    constructor(scope: Construct, id: string, props: cdk.StackProps);
}
