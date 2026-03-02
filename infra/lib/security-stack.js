"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const wafv2 = __importStar(require("aws-cdk-lib/aws-wafv2"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
class SecurityStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            scope: 'CLOUDFRONT', // CloudFront ke liye REGIONAL nahi CLOUDFRONT
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
                            limit: 2000, // 2000 requests per 5 minutes per IP
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
                    bedrock_model_id: 'amazon.nova-pro-v1:0',
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
exports.SecurityStack = SecurityStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLDZEQUErQztBQUMvQywrRUFBaUU7QUFDakUseURBQTJDO0FBRzNDLE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSXhDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBcUI7UUFDM0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsaUNBQWlDO1FBQ2pDLG1DQUFtQztRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ3RDLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDMUMsQ0FBQyxDQUFDO1FBRUgsb0JBQW9CO1FBQ3BCLHFEQUFxRDtRQUNyRCxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNoQyxJQUFJLEVBQUUsaUJBQWlCO1lBQ3ZCLEtBQUssRUFBRSxZQUFZLEVBQUcsOENBQThDO1lBQ3BFLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7WUFDNUIsS0FBSyxFQUFFO2dCQUNILHNEQUFzRDtnQkFDdEQ7b0JBQ0ksSUFBSSxFQUFFLGVBQWU7b0JBQ3JCLFFBQVEsRUFBRSxDQUFDO29CQUNYLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7b0JBQzVCLFNBQVMsRUFBRTt3QkFDUCx5QkFBeUIsRUFBRTs0QkFDdkIsVUFBVSxFQUFFLEtBQUs7NEJBQ2pCLElBQUksRUFBRSw4QkFBOEI7eUJBQ3ZDO3FCQUNKO29CQUNELGdCQUFnQixFQUFFO3dCQUNkLHdCQUF3QixFQUFFLElBQUk7d0JBQzlCLFVBQVUsRUFBRSxlQUFlO3dCQUMzQixzQkFBc0IsRUFBRSxJQUFJO3FCQUMvQjtpQkFDSjtnQkFDRCx3REFBd0Q7Z0JBQ3hEO29CQUNJLElBQUksRUFBRSxXQUFXO29CQUNqQixRQUFRLEVBQUUsQ0FBQztvQkFDWCxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO29CQUNyQixTQUFTLEVBQUU7d0JBQ1Asa0JBQWtCLEVBQUU7NEJBQ2hCLEtBQUssRUFBRSxJQUFJLEVBQVcscUNBQXFDOzRCQUMzRCxnQkFBZ0IsRUFBRSxJQUFJO3lCQUN6QjtxQkFDSjtvQkFDRCxnQkFBZ0IsRUFBRTt3QkFDZCx3QkFBd0IsRUFBRSxJQUFJO3dCQUM5QixVQUFVLEVBQUUsV0FBVzt3QkFDdkIsc0JBQXNCLEVBQUUsSUFBSTtxQkFDL0I7aUJBQ0o7YUFDSjtZQUNELGdCQUFnQixFQUFFO2dCQUNkLHdCQUF3QixFQUFFLElBQUk7Z0JBQzlCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixzQkFBc0IsRUFBRSxJQUFJO2FBQy9CO1NBQ0osQ0FBQyxDQUFDO1FBRUgsd0JBQXdCO1FBQ3hCLHdDQUF3QztRQUN4QyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUMxQyxVQUFVLEVBQUUsMEJBQTBCO1lBQ3RDLFdBQVcsRUFBRSx1Q0FBdUM7WUFDcEQsYUFBYSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQzFCLG9CQUFvQixFQUFFO2dCQUNsQixvQkFBb0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNqQyxnQkFBZ0IsRUFBRSxzQkFBc0I7b0JBQ3hDLGNBQWMsRUFBRSxPQUFPO29CQUN2QixjQUFjLEVBQUUsT0FBTztvQkFDdkIsZ0JBQWdCLEVBQUUsdUJBQXVCO29CQUN6QyxpQkFBaUIsRUFBRSxDQUFDO29CQUNwQixlQUFlLEVBQUUsR0FBRztvQkFDcEIsb0JBQW9CLEVBQUUsR0FBRztvQkFDekIsbUJBQW1CLEVBQUUsR0FBRztvQkFDeEIsaUJBQWlCLEVBQUUsR0FBRztpQkFDekIsQ0FBQztnQkFDRixpQkFBaUIsRUFBRSxrQkFBa0I7YUFDeEM7U0FDSixDQUFDLENBQUM7UUFFSCxrQ0FBa0M7UUFDbEMsa0NBQWtDO1FBQ2xDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUMxRCxTQUFTLEVBQUUsd0JBQXdCO1lBQ25DLFdBQVcsRUFBRSxtQ0FBbUM7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ2pDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDekIsVUFBVSxFQUFFLGdCQUFnQjtTQUMvQixDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzFDLEtBQUssRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVE7WUFDcEMsVUFBVSxFQUFFLHlCQUF5QjtTQUN4QyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUF4R0Qsc0NBd0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xyXG5pbXBvcnQgKiBhcyB3YWZ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtd2FmdjInO1xyXG5pbXBvcnQgKiBhcyBzZWNyZXRzbWFuYWdlciBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc2VjcmV0c21hbmFnZXInO1xyXG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNlY3VyaXR5U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGttc0tleToga21zLktleTtcclxuICAgIHB1YmxpYyByZWFkb25seSBlc2NhbGF0aW9uVG9waWM6IHNucy5Ub3BpYztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIEtNUyBDdXN0b21lciBNYW5hZ2VkIEtleSDilIDilIBcclxuICAgICAgICAvLyBEeW5hbW9EQiwgUzMgc2FiIGlzZSB1c2Uga2FyZW5nZVxyXG4gICAgICAgIHRoaXMua21zS2V5ID0gbmV3IGttcy5LZXkodGhpcywgJ0FwcEtleScsIHtcclxuICAgICAgICAgICAgYWxpYXM6ICdhbGlhcy9ueWF5YS1taXRyYS1rZXknLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ055YXlhIE1pdHJhIG1hc3RlciBlbmNyeXB0aW9uIGtleScsXHJcbiAgICAgICAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIFdBRiBXZWIgQUNMIOKUgOKUgFxyXG4gICAgICAgIC8vIENsb3VkRnJvbnQga2Ugc2FhdGggdXNlIGhvZ2kgKGZyb250ZW5kIHByb3RlY3Rpb24pXHJcbiAgICAgICAgbmV3IHdhZnYyLkNmbldlYkFDTCh0aGlzLCAnQXBwV2FmJywge1xyXG4gICAgICAgICAgICBuYW1lOiAnbnlheWEtbWl0cmEtd2FmJyxcclxuICAgICAgICAgICAgc2NvcGU6ICdDTE9VREZST05UJywgIC8vIENsb3VkRnJvbnQga2UgbGl5ZSBSRUdJT05BTCBuYWhpIENMT1VERlJPTlRcclxuICAgICAgICAgICAgZGVmYXVsdEFjdGlvbjogeyBhbGxvdzoge30gfSxcclxuICAgICAgICAgICAgcnVsZXM6IFtcclxuICAgICAgICAgICAgICAgIC8vIFJ1bGUgMTogQVdTIGNvbW1vbiBzZWN1cml0eSBydWxlcyAoU1FMaSwgWFNTLCBldGMuKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdDb21tb25SdWxlU2V0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogMSxcclxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZUFjdGlvbjogeyBub25lOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkUnVsZUdyb3VwU3RhdGVtZW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZW5kb3JOYW1lOiAnQVdTJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNDb21tb25SdWxlU2V0J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb3VkV2F0Y2hNZXRyaWNzRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NvbW1vblJ1bGVTZXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIFJ1bGUgMjogUmF0ZSBsaW1pdGluZyDigJQgZWsgSVAgc2UgenlhZGEgcmVxdWVzdHMgYmxvY2tcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnUmF0ZUxpbWl0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogMixcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHsgYmxvY2s6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhdGVCYXNlZFN0YXRlbWVudDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IDIwMDAsICAgICAgICAgIC8vIDIwMDAgcmVxdWVzdHMgcGVyIDUgbWludXRlcyBwZXIgSVBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUtleVR5cGU6ICdJUCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eUNvbmZpZzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSYXRlTGltaXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XHJcbiAgICAgICAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnTnlheWFXYWYnLFxyXG4gICAgICAgICAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIOKUgOKUgCBTZWNyZXRzIE1hbmFnZXIg4pSA4pSAXHJcbiAgICAgICAgLy8gU2FiIHNlbnNpdGl2ZSBjb25maWcgeWFoYW4gc3RvcmUgaG9naVxyXG4gICAgICAgIG5ldyBzZWNyZXRzbWFuYWdlci5TZWNyZXQodGhpcywgJ0FwcFNlY3JldHMnLCB7XHJcbiAgICAgICAgICAgIHNlY3JldE5hbWU6ICcvbnlheWEtbWl0cmEvcHJvZC9jb25maWcnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ055YXlhIE1pdHJhIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24nLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5OiB0aGlzLmttc0tleSxcclxuICAgICAgICAgICAgZ2VuZXJhdGVTZWNyZXRTdHJpbmc6IHtcclxuICAgICAgICAgICAgICAgIHNlY3JldFN0cmluZ1RlbXBsYXRlOiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYmVkcm9ja19tb2RlbF9pZDogJ2FtYXpvbi5ub3ZhLXByby12MTowJyxcclxuICAgICAgICAgICAgICAgICAgICBwb2xseV92b2ljZV9oaTogJ0FkaXRpJyxcclxuICAgICAgICAgICAgICAgICAgICBwb2xseV92b2ljZV9lbjogJ0thamFsJyxcclxuICAgICAgICAgICAgICAgICAgICBzZXNfc2VuZGVyX2VtYWlsOiAnbm9yZXBseUBueWF5YW1pdHJhLmluJyxcclxuICAgICAgICAgICAgICAgICAgICBndWVzdF9xdWVyeV9saW1pdDogNSxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfdG9rZW5zX2NoYXQ6IDUwMCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfdG9rZW5zX2NvbXBsYWludDogNzAwLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heF90b2tlbnNfdGltZWxpbmU6IDgwMCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfdG9rZW5zX25vdGljZTogNzAwXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIGdlbmVyYXRlU3RyaW5nS2V5OiAnaW50ZXJuYWxfYXBpX2tleSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgU05TIFRvcGljIGZvciBFc2NhbGF0aW9ucyDilIDilIBcclxuICAgICAgICAvLyBISUdIIHJpc2sgY2FzZXMgcGUgYWxlcnQgamF5ZWdhXHJcbiAgICAgICAgdGhpcy5lc2NhbGF0aW9uVG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdFc2NhbGF0aW9uVG9waWMnLCB7XHJcbiAgICAgICAgICAgIHRvcGljTmFtZTogJ255YXlhLW1pdHJhLWVzY2FsYXRpb24nLFxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogJ055YXlhIE1pdHJhIEhpZ2ggUmlzayBFc2NhbGF0aW9ucydcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gT3V0cHV0c1xyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdLbXNLZXlBcm4nLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmttc0tleS5rZXlBcm4sXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YUttc0tleUFybidcclxuICAgICAgICB9KTtcclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRXNjYWxhdGlvblRvcGljQXJuJywge1xyXG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5lc2NhbGF0aW9uVG9waWMudG9waWNBcm4sXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YUVzY2FsYXRpb25Ub3BpY0FybidcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=