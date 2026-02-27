import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
    public readonly kmsKey: kms.Key;
    public readonly escalationTopic: sns.Topic;

    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        // ── KMS Customer Managed Key ──
        // DynamoDB, S3 sab ise use karenge
        this.kmsKey = new kms.Key(this, 'AppKey', {
            alias: 'alias/nyaya-mitra-key',
            description: 'Nyaya Mitra master encryption key',
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });

        // ── WAF Web ACL ──
        // CloudFront ke saath use hogi (frontend protection)
        new wafv2.CfnWebACL(this, 'AppWaf', {
            name: 'nyaya-mitra-waf',
            scope: 'CLOUDFRONT',  // CloudFront ke liye REGIONAL nahi CLOUDFRONT
            defaultAction: { allow: {} },
            rules: [
                // Rule 1: AWS common security rules (SQLi, XSS, etc.)
                {
                    name: 'CommonRuleSet',
                    priority: 1,
                    overrideAction: { none: {} },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet'
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'CommonRuleSet',
                        sampledRequestsEnabled: true
                    }
                },
                // Rule 2: Rate limiting — ek IP se zyada requests block
                {
                    name: 'RateLimit',
                    priority: 2,
                    action: { block: {} },
                    statement: {
                        rateBasedStatement: {
                            limit: 2000,          // 2000 requests per 5 minutes per IP
                            aggregateKeyType: 'IP'
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimit',
                        sampledRequestsEnabled: true
                    }
                }
            ],
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'NyayaWaf',
                sampledRequestsEnabled: true
            }
        });

        // ── Secrets Manager ──
        // Sab sensitive config yahan store hogi
        new secretsmanager.Secret(this, 'AppSecrets', {
            secretName: '/nyaya-mitra/prod/config',
            description: 'Nyaya Mitra application configuration',
            encryptionKey: this.kmsKey,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    bedrock_model_id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                    polly_voice_hi: 'Aditi',
                    polly_voice_en: 'Kajal',
                    ses_sender_email: 'noreply@nyayamitra.in',
                    guest_query_limit: 5,
                    max_tokens_chat: 500,
                    max_tokens_complaint: 700,
                    max_tokens_timeline: 800,
                    max_tokens_notice: 700
                }),
                generateStringKey: 'internal_api_key'
            }
        });

        // ── SNS Topic for Escalations ──
        // HIGH risk cases pe alert jayega
        this.escalationTopic = new sns.Topic(this, 'EscalationTopic', {
            topicName: 'nyaya-mitra-escalation',
            displayName: 'Nyaya Mitra High Risk Escalations'
        });

        // Outputs
        new cdk.CfnOutput(this, 'KmsKeyArn', {
            value: this.kmsKey.keyArn,
            exportName: 'NyayaKmsKeyArn'
        });
        new cdk.CfnOutput(this, 'EscalationTopicArn', {
            value: this.escalationTopic.topicArn,
            exportName: 'NyayaEscalationTopicArn'
        });
    }
}
