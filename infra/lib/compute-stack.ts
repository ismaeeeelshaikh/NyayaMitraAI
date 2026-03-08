import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration, WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
    tables: { [key: string]: dynamodb.Table };
    buckets: { [key: string]: s3.Bucket };
    httpApi: apigatewayv2.HttpApi;
    webSocketApi: apigatewayv2.WebSocketApi;
}

export class ComputeStack extends cdk.Stack {
    public readonly lambdas: { [key: string]: lambda.Function } = {};

    constructor(scope: Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);

        // ── 1. Create SNS Topic for Escalations ──
        const escalationTopic = new sns.Topic(this, 'EscalationAlerts', {
            topicName: 'nyaya-mitra-escalation-alerts'
        });

        // ── 2. Create Shared IAM Role (nyaya-mitra-lambda-role) ──
        const lambdaRole = new iam.Role(this, 'SharedLambdaRole', {
            roleName: 'nyaya-mitra-lambda-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('ComprehendFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTranscribeFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonPollyFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTextractFullAccess')
            ]
        });

        // Add scoped runtime policy (same as deploy-all.ps1)
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            sid: 'DynamoScopedAccess',
            effect: iam.Effect.ALLOW,
            actions: [
                'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem',
                'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:BatchGetItem', 'dynamodb:BatchWriteItem'
            ],
            resources: [
                `arn:aws:dynamodb:${this.region}:${this.account}:table/nyaya-mitra-*`,
                `arn:aws:dynamodb:${this.region}:${this.account}:table/nyaya-mitra-*/index/*`
            ]
        }));

        lambdaRole.addToPolicy(new iam.PolicyStatement({
            sid: 'S3ObjectScopedAccess',
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [
                `${props.buckets.legalCorpus.bucketArn}/*`,
                `${props.buckets.userUploads.bucketArn}/*`,
                `${props.buckets.userDocuments.bucketArn}/*`,
                `${props.buckets.frontend.bucketArn}/*`,
                `${props.buckets.templates.bucketArn}/*`
            ]
        }));

        lambdaRole.addToPolicy(new iam.PolicyStatement({
            sid: 'S3BucketListAccess',
            effect: iam.Effect.ALLOW,
            actions: ['s3:ListBucket'],
            resources: [
                props.buckets.legalCorpus.bucketArn,
                props.buckets.userUploads.bucketArn,
                props.buckets.userDocuments.bucketArn,
                props.buckets.frontend.bucketArn,
                props.buckets.templates.bucketArn
            ]
        }));

        lambdaRole.addToPolicy(new iam.PolicyStatement({
            sid: 'LambdaInvokeScoped',
            effect: iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: [`arn:aws:lambda:${this.region}:${this.account}:function:nyaya-mitra-*`]
        }));

        lambdaRole.addToPolicy(new iam.PolicyStatement({
            sid: 'WsConnectionManage',
            effect: iam.Effect.ALLOW,
            actions: ['execute-api:ManageConnections'],
            resources: [`arn:aws:execute-api:${this.region}:${this.account}:*/*/@connections/*`]
        }));

        // ── 3. Define Lambda Environment Variables ──
        const environment = {
            TABLE_PREFIX: 'nyaya-mitra',
            LEGAL_CORPUS_BUCKET: props.buckets.legalCorpus.bucketName,
            USER_UPLOADS_BUCKET: props.buckets.userUploads.bucketName,
            USER_DOCUMENTS_BUCKET: props.buckets.userDocuments.bucketName,
            BEDROCK_MODEL_ID: 'amazon.nova-pro-v1:0',
            POLLY_VOICE_HI: 'Aditi',
            POLLY_VOICE_EN: 'Kajal',
            ESCALATION_TOPIC_ARN: escalationTopic.topicArn,
            GUEST_QUERY_LIMIT: '5',
            MAX_TOKENS_CHAT: '500'
        };

        const backendLambdasDir = path.resolve(__dirname, '../../backend/lambdas');

        // Helper function to create Lambda
        const createLambda = (id: string, name: string, entryFolder: string, timeoutSecs: number, memorySize: number) => {
            const fn = new lambda.Function(this, id, {
                functionName: name,
                code: lambda.Code.fromAsset(path.join(backendLambdasDir, entryFolder)),
                handler: 'index.handler',
                runtime: lambda.Runtime.PYTHON_3_11,
                role: lambdaRole,
                timeout: cdk.Duration.seconds(timeoutSecs),
                memorySize,
                environment
            });
            this.lambdas[id] = fn;
            return fn;
        };

        // ── 4. Create All 24 Lambdas ──
        createLambda('WsConnect', 'nyaya-mitra-ws-connect', 'chat/websocket_connect', 30, 128);
        createLambda('WsDisconnect', 'nyaya-mitra-ws-disconnect', 'chat/websocket_disconnect', 10, 128);
        createLambda('MessageOrchestrator', 'nyaya-mitra-message-orchestrator', 'chat/message_orchestrator', 60, 512);
        createLambda('IntentClassifier', 'nyaya-mitra-intent-classifier', 'chat/intent_classifier', 30, 256);
        createLambda('RiskScorer', 'nyaya-mitra-risk-scorer', 'chat/risk_scorer', 10, 128);
        createLambda('S3RagRetriever', 'nyaya-mitra-s3-rag-retriever', 'chat/s3_rag_retriever', 30, 256);
        createLambda('BedrockGenerator', 'nyaya-mitra-bedrock-generator', 'chat/bedrock_generator', 60, 256);
        createLambda('ConfidenceCalculator', 'nyaya-mitra-confidence-calculator', 'chat/confidence_calculator', 10, 128);
        createLambda('EscalationRouter', 'nyaya-mitra-escalation-router', 'chat/escalation_router', 30, 256);
        createLambda('FactExtractor', 'nyaya-mitra-fact-extractor', 'chat/fact_extractor', 60, 256);
        createLambda('ActionRecommender', 'nyaya-mitra-action-recommender', 'chat/action_recommender', 10, 128);

        createLambda('SessionHandler', 'nyaya-mitra-session-handler', 'entry/session_handler', 30, 128);
        createLambda('VoiceInput', 'nyaya-mitra-voice-input', 'voice/voice_input_handler', 60, 256);
        createLambda('VoiceStatus', 'nyaya-mitra-voice-status', 'voice/voice_status_handler', 30, 256);
        createLambda('TextToSpeech', 'nyaya-mitra-text-to-speech', 'voice/text_to_speech', 30, 256);

        createLambda('NoticeScanner', 'nyaya-mitra-notice-scanner', 'documents/notice_scanner', 60, 512);
        createLambda('NoticeAnalysis', 'nyaya-mitra-notice-analysis', 'documents/notice_analysis', 60, 512);
        createLambda('ComplaintGenerator', 'nyaya-mitra-complaint-generator', 'documents/complaint_generator', 60, 512);
        createLambda('ComplaintDelivery', 'nyaya-mitra-complaint-delivery', 'documents/complaint_delivery', 30, 256);
        createLambda('TimelineBuilder', 'nyaya-mitra-timeline-builder', 'documents/timeline_builder', 60, 512);
        createLambda('TimelinePdf', 'nyaya-mitra-timeline-pdf-generator', 'documents/timeline_pdf_generator', 60, 512);
        createLambda('DashboardWidgets', 'nyaya-mitra-dashboard-widgets', 'documents/dashboard_widgets', 30, 256);
        createLambda('DeadlineReminder', 'nyaya-mitra-deadline-reminder', 'documents/deadline_reminder', 30, 256);
        createLambda('LegalAidEscalator', 'nyaya-mitra-legal-aid-escalator', 'documents/legal_aid_escalator', 30, 256);

        // ── 5. Attach API Gateway Routes ──

        // HTTP API Routes
        props.httpApi.addRoutes({
            path: '/v1/entry/session',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('SessionInt', this.lambdas['SessionHandler'])
        });
        props.httpApi.addRoutes({
            path: '/v1/voice/input',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('VoiceInputInt', this.lambdas['VoiceInput'])
        });
        props.httpApi.addRoutes({
            path: '/v1/voice/status',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration('VoiceStatusInt', this.lambdas['VoiceStatus'])
        });
        props.httpApi.addRoutes({
            path: '/v1/voice/output',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('VoiceOutputInt', this.lambdas['TextToSpeech'])
        });
        props.httpApi.addRoutes({
            path: '/v1/timeline/extract',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('TimelineExtractInt', this.lambdas['TimelineBuilder'])
        });
        props.httpApi.addRoutes({
            path: '/v1/timeline/export',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('TimelinePdfInt', this.lambdas['TimelinePdf'])
        });
        props.httpApi.addRoutes({
            path: '/v1/complaints/generate',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('ComplaintGenInt', this.lambdas['ComplaintGenerator'])
        });
        props.httpApi.addRoutes({
            path: '/v1/complaints/deliver',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('ComplaintDelInt', this.lambdas['ComplaintDelivery'])
        });
        props.httpApi.addRoutes({
            path: '/v1/notices/upload',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('NoticeUploadInt', this.lambdas['NoticeScanner'])
        });
        props.httpApi.addRoutes({
            path: '/v1/notices/{notice_id}/analysis',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration('NoticeAnalysisInt', this.lambdas['NoticeScanner']) // NoticeScanner handles both GET and POST
        });
        props.httpApi.addRoutes({
            path: '/v1/legal-aid/escalate',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new HttpLambdaIntegration('LegalAidEscInt', this.lambdas['LegalAidEscalator'])
        });
        props.httpApi.addRoutes({
            path: '/v1/legal-aid/referrals',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration('LegalAidRefInt', this.lambdas['LegalAidEscalator'])
        });
        props.httpApi.addRoutes({
            path: '/v1/dashboard/widgets',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration('DashboardInt', this.lambdas['DashboardWidgets'])
        });

        // WebSocket API Routes
        props.webSocketApi.addRoute('$connect', {
            integration: new WebSocketLambdaIntegration('WsConnectInt', this.lambdas['WsConnect'])
        });
        props.webSocketApi.addRoute('$disconnect', {
            integration: new WebSocketLambdaIntegration('WsDisconnectInt', this.lambdas['WsDisconnect'])
        });
        props.webSocketApi.addRoute('sendMessage', {
            integration: new WebSocketLambdaIntegration('WsMessageInt', this.lambdas['MessageOrchestrator'])
        });
    }
}
