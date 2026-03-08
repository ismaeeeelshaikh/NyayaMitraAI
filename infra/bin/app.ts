#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecurityStack } from '../lib/security-stack';
import { IdentityStack } from '../lib/identity-stack';
import { DataStack } from '../lib/data-stack';
import { ApiStack } from '../lib/api-stack';
import { OpsStack } from '../lib/ops-stack';
import { ComputeStack } from '../lib/compute-stack';

const app = new cdk.App();

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1'  // Mumbai — India ke liye
};

// ORDER BAHUT IMPORTANT HAI — dependency chain hai
const security = new SecurityStack(app, 'NyayaSecurityStack', { env });

const identity = new IdentityStack(app, 'NyayaIdentityStack', {
    env,
    kmsKey: security.kmsKey
});

const data = new DataStack(app, 'NyayaDataStack', {
    env,
    kmsKey: security.kmsKey
});

const api = new ApiStack(app, 'NyayaApiStack', {
    env,
    userPool: identity.userPool,
    userPoolClient: identity.userPoolClient
});

const compute = new ComputeStack(app, 'NyayaComputeStack', {
    env,
    tables: data.tables,
    buckets: data.buckets,
    httpApi: api.httpApi,
    webSocketApi: api.webSocketApi
});

new OpsStack(app, 'NyayaOpsStack', {
    env,
    httpApi: api.httpApi
});

app.synth();
