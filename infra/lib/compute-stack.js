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
exports.ComputeStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const aws_apigatewayv2_integrations_1 = require("aws-cdk-lib/aws-apigatewayv2-integrations");
const python = __importStar(require("@aws-cdk/aws-lambda-python-alpha"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const path = __importStar(require("path"));
class ComputeStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.lambdas = {};
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
        const createLambda = (id, name, entryFolder, timeoutSecs, memorySize) => {
            const fn = new python.PythonFunction(this, id, {
                functionName: name,
                entry: path.join(backendLambdasDir, entryFolder),
                index: 'index.py',
                handler: 'handler',
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
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('SessionInt', this.lambdas['SessionHandler'])
        });
        props.httpApi.addRoutes({
            path: '/v1/voice/input',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('VoiceInputInt', this.lambdas['VoiceInput'])
        });
        props.httpApi.addRoutes({
            path: '/v1/voice/status',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('VoiceStatusInt', this.lambdas['VoiceStatus'])
        });
        props.httpApi.addRoutes({
            path: '/v1/voice/output',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('VoiceOutputInt', this.lambdas['TextToSpeech'])
        });
        props.httpApi.addRoutes({
            path: '/v1/timeline/extract',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('TimelineExtractInt', this.lambdas['TimelineBuilder'])
        });
        props.httpApi.addRoutes({
            path: '/v1/timeline/export',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('TimelinePdfInt', this.lambdas['TimelinePdf'])
        });
        props.httpApi.addRoutes({
            path: '/v1/complaints/generate',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('ComplaintGenInt', this.lambdas['ComplaintGenerator'])
        });
        props.httpApi.addRoutes({
            path: '/v1/complaints/deliver',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('ComplaintDelInt', this.lambdas['ComplaintDelivery'])
        });
        props.httpApi.addRoutes({
            path: '/v1/notices/upload',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('NoticeUploadInt', this.lambdas['NoticeScanner'])
        });
        props.httpApi.addRoutes({
            path: '/v1/notices/{notice_id}/analysis',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('NoticeAnalysisInt', this.lambdas['NoticeScanner']) // NoticeScanner handles both GET and POST
        });
        props.httpApi.addRoutes({
            path: '/v1/legal-aid/escalate',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('LegalAidEscInt', this.lambdas['LegalAidEscalator'])
        });
        props.httpApi.addRoutes({
            path: '/v1/legal-aid/referrals',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('LegalAidRefInt', this.lambdas['LegalAidEscalator'])
        });
        props.httpApi.addRoutes({
            path: '/v1/dashboard/widgets',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new aws_apigatewayv2_integrations_1.HttpLambdaIntegration('DashboardInt', this.lambdas['DashboardWidgets'])
        });
        // WebSocket API Routes
        props.webSocketApi.addRoute('$connect', {
            integration: new aws_apigatewayv2_integrations_1.WebSocketLambdaIntegration('WsConnectInt', this.lambdas['WsConnect'])
        });
        props.webSocketApi.addRoute('$disconnect', {
            integration: new aws_apigatewayv2_integrations_1.WebSocketLambdaIntegration('WsDisconnectInt', this.lambdas['WsDisconnect'])
        });
        props.webSocketApi.addRoute('sendMessage', {
            integration: new aws_apigatewayv2_integrations_1.WebSocketLambdaIntegration('WsMessageInt', this.lambdas['MessageOrchestrator'])
        });
    }
}
exports.ComputeStack = ComputeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXB1dGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHlEQUEyQztBQUczQyx5REFBMkM7QUFDM0MsMkVBQTZEO0FBQzdELDZGQUE4RztBQUM5Ryx5RUFBMkQ7QUFDM0QsK0RBQWlEO0FBQ2pELDJDQUE2QjtBQVU3QixNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUd2QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBSFosWUFBTyxHQUF1QyxFQUFFLENBQUM7UUFLN0QsNENBQTRDO1FBQzVDLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDNUQsU0FBUyxFQUFFLCtCQUErQjtTQUM3QyxDQUFDLENBQUM7UUFFSCw0REFBNEQ7UUFDNUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0RCxRQUFRLEVBQUUseUJBQXlCO1lBQ25DLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxlQUFlLEVBQUU7Z0JBQ2IsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQ0FBMEMsQ0FBQztnQkFDdEYsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyx5QkFBeUIsQ0FBQztnQkFDckUsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBc0IsQ0FBQztnQkFDbEUsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyw0QkFBNEIsQ0FBQztnQkFD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QUFDLG1CQUFtQixDQUFDLENBQUM7U0FDOUYsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDcEIsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUN0QyxXQUFXLEVBQUUsSUFBSSxxREFBcUIsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQzNGLENBQUMsQ0FBQztRQUVILHVCQUF1QjtRQUN2QixLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7WUFDcEMsV0FBVyxFQUFFLElBQUksMERBQTBCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDekYsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFO1lBQ3ZDLFdBQVcsRUFBRSxJQUFJLDBEQUEwQixDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDL0YsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFO1lBQ3ZDLFdBQVcsRUFBRSxJQUFJLDBEQUEwQixDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbkcsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBN05ELG9DQTZOQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcclxuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcclxuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5djIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXl2Mic7XHJcbmltcG9ydCB7IEh0dHBMYW1iZGFJbnRlZ3JhdGlvbiwgV2ViU29ja2V0TGFtYmRhSW50ZWdyYXRpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyLWludGVncmF0aW9ucyc7XHJcbmltcG9ydCAqIGFzIHB5dGhvbiBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhLXB5dGhvbi1hbHBoYSc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgQ29tcHV0ZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgICB0YWJsZXM6IHsgW2tleTogc3RyaW5nXTogZHluYW1vZGIuVGFibGUgfTtcclxuICAgIGJ1Y2tldHM6IHsgW2tleTogc3RyaW5nXTogczMuQnVja2V0IH07XHJcbiAgICBodHRwQXBpOiBhcGlnYXRld2F5djIuSHR0cEFwaTtcclxuICAgIHdlYlNvY2tldEFwaTogYXBpZ2F0ZXdheXYyLldlYlNvY2tldEFwaTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbXB1dGVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhczogeyBba2V5OiBzdHJpbmddOiBsYW1iZGEuRnVuY3Rpb24gfSA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDb21wdXRlU3RhY2tQcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgMS4gQ3JlYXRlIFNOUyBUb3BpYyBmb3IgRXNjYWxhdGlvbnMg4pSA4pSAXHJcbiAgICAgICAgY29uc3QgZXNjYWxhdGlvblRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnRXNjYWxhdGlvbkFsZXJ0cycsIHtcclxuICAgICAgICAgICAgdG9waWNOYW1lOiAnbnlheWEtbWl0cmEtZXNjYWxhdGlvbi1hbGVydHMnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIOKUgOKUgCAyLiBDcmVhdGUgU2hhcmVkIElBTSBSb2xlIChueWF5YS1taXRyYS1sYW1iZGEtcm9sZSkg4pSA4pSAXHJcbiAgICAgICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnU2hhcmVkTGFtYmRhUm9sZScsIHtcclxuICAgICAgICAgICAgcm9sZU5hbWU6ICdueWF5YS1taXRyYS1sYW1iZGEtcm9sZScsXHJcbiAgICAgICAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxyXG4gICAgICAgICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcclxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25CZWRyb2NrRnVsbEFjY2VzcycpLFxyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDb21wcmVoZW5kRnVsbEFjY2VzcycpLFxyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25UcmFuc2NyaWJlRnVsbEFjY2VzcycpLFxyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25Qb2xseUZ1bGxBY2Nlc3MnKSxcclxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU05TRnVsbEFjY2VzcycpLFxyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25UZXh0cmFjdEZ1bGxBY2Nlc3MnKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCBzY29wZWQgcnVudGltZSBwb2xpY3kgKHNhbWUgYXMgZGVwbG95LWFsbC5wczEpXHJcbiAgICAgICAgbGFtYmRhUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICAgIHNpZDogJ0R5bmFtb1Njb3BlZEFjY2VzcycsXHJcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOkdldEl0ZW0nLCAnZHluYW1vZGI6UHV0SXRlbScsICdkeW5hbW9kYjpVcGRhdGVJdGVtJywgJ2R5bmFtb2RiOkRlbGV0ZUl0ZW0nLFxyXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlF1ZXJ5JywgJ2R5bmFtb2RiOlNjYW4nLCAnZHluYW1vZGI6QmF0Y2hHZXRJdGVtJywgJ2R5bmFtb2RiOkJhdGNoV3JpdGVJdGVtJ1xyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICAgICAgICAgIGBhcm46YXdzOmR5bmFtb2RiOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTp0YWJsZS9ueWF5YS1taXRyYS0qYCxcclxuICAgICAgICAgICAgICAgIGBhcm46YXdzOmR5bmFtb2RiOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTp0YWJsZS9ueWF5YS1taXRyYS0qL2luZGV4LypgXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGxhbWJkYVJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICBzaWQ6ICdTM09iamVjdFNjb3BlZEFjY2VzcycsXHJcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0JywgJ3MzOkRlbGV0ZU9iamVjdCddLFxyXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICAgICAgICAgIGAke3Byb3BzLmJ1Y2tldHMubGVnYWxDb3JwdXMuYnVja2V0QXJufS8qYCxcclxuICAgICAgICAgICAgICAgIGAke3Byb3BzLmJ1Y2tldHMudXNlclVwbG9hZHMuYnVja2V0QXJufS8qYCxcclxuICAgICAgICAgICAgICAgIGAke3Byb3BzLmJ1Y2tldHMudXNlckRvY3VtZW50cy5idWNrZXRBcm59LypgLFxyXG4gICAgICAgICAgICAgICAgYCR7cHJvcHMuYnVja2V0cy5mcm9udGVuZC5idWNrZXRBcm59LypgLFxyXG4gICAgICAgICAgICAgICAgYCR7cHJvcHMuYnVja2V0cy50ZW1wbGF0ZXMuYnVja2V0QXJufS8qYFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgc2lkOiAnUzNCdWNrZXRMaXN0QWNjZXNzJyxcclxuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOkxpc3RCdWNrZXQnXSxcclxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXHJcbiAgICAgICAgICAgICAgICBwcm9wcy5idWNrZXRzLmxlZ2FsQ29ycHVzLmJ1Y2tldEFybixcclxuICAgICAgICAgICAgICAgIHByb3BzLmJ1Y2tldHMudXNlclVwbG9hZHMuYnVja2V0QXJuLFxyXG4gICAgICAgICAgICAgICAgcHJvcHMuYnVja2V0cy51c2VyRG9jdW1lbnRzLmJ1Y2tldEFybixcclxuICAgICAgICAgICAgICAgIHByb3BzLmJ1Y2tldHMuZnJvbnRlbmQuYnVja2V0QXJuLFxyXG4gICAgICAgICAgICAgICAgcHJvcHMuYnVja2V0cy50ZW1wbGF0ZXMuYnVja2V0QXJuXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGxhbWJkYVJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICBzaWQ6ICdMYW1iZGFJbnZva2VTY29wZWQnLFxyXG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgIGFjdGlvbnM6IFsnbGFtYmRhOkludm9rZUZ1bmN0aW9uJ10sXHJcbiAgICAgICAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOmxhbWJkYToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06ZnVuY3Rpb246bnlheWEtbWl0cmEtKmBdXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgc2lkOiAnV3NDb25uZWN0aW9uTWFuYWdlJyxcclxuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2V4ZWN1dGUtYXBpOk1hbmFnZUNvbm5lY3Rpb25zJ10sXHJcbiAgICAgICAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOmV4ZWN1dGUtYXBpOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fToqLyovQGNvbm5lY3Rpb25zLypgXVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIDMuIERlZmluZSBMYW1iZGEgRW52aXJvbm1lbnQgVmFyaWFibGVzIOKUgOKUgFxyXG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50ID0ge1xyXG4gICAgICAgICAgICBUQUJMRV9QUkVGSVg6ICdueWF5YS1taXRyYScsXHJcbiAgICAgICAgICAgIExFR0FMX0NPUlBVU19CVUNLRVQ6IHByb3BzLmJ1Y2tldHMubGVnYWxDb3JwdXMuYnVja2V0TmFtZSxcclxuICAgICAgICAgICAgVVNFUl9VUExPQURTX0JVQ0tFVDogcHJvcHMuYnVja2V0cy51c2VyVXBsb2Fkcy5idWNrZXROYW1lLFxyXG4gICAgICAgICAgICBVU0VSX0RPQ1VNRU5UU19CVUNLRVQ6IHByb3BzLmJ1Y2tldHMudXNlckRvY3VtZW50cy5idWNrZXROYW1lLFxyXG4gICAgICAgICAgICBCRURST0NLX01PREVMX0lEOiAnYW1hem9uLm5vdmEtcHJvLXYxOjAnLFxyXG4gICAgICAgICAgICBQT0xMWV9WT0lDRV9ISTogJ0FkaXRpJyxcclxuICAgICAgICAgICAgUE9MTFlfVk9JQ0VfRU46ICdLYWphbCcsXHJcbiAgICAgICAgICAgIEVTQ0FMQVRJT05fVE9QSUNfQVJOOiBlc2NhbGF0aW9uVG9waWMudG9waWNBcm4sXHJcbiAgICAgICAgICAgIEdVRVNUX1FVRVJZX0xJTUlUOiAnNScsXHJcbiAgICAgICAgICAgIE1BWF9UT0tFTlNfQ0hBVDogJzUwMCdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBiYWNrZW5kTGFtYmRhc0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9iYWNrZW5kL2xhbWJkYXMnKTtcclxuXHJcbiAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBMYW1iZGFcclxuICAgICAgICBjb25zdCBjcmVhdGVMYW1iZGEgPSAoaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBlbnRyeUZvbGRlcjogc3RyaW5nLCB0aW1lb3V0U2VjczogbnVtYmVyLCBtZW1vcnlTaXplOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZm4gPSBuZXcgcHl0aG9uLlB5dGhvbkZ1bmN0aW9uKHRoaXMsIGlkLCB7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbk5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBlbnRyeTogcGF0aC5qb2luKGJhY2tlbmRMYW1iZGFzRGlyLCBlbnRyeUZvbGRlciksXHJcbiAgICAgICAgICAgICAgICBpbmRleDogJ2luZGV4LnB5JyxcclxuICAgICAgICAgICAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcclxuICAgICAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzExLFxyXG4gICAgICAgICAgICAgICAgcm9sZTogbGFtYmRhUm9sZSxcclxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKHRpbWVvdXRTZWNzKSxcclxuICAgICAgICAgICAgICAgIG1lbW9yeVNpemUsXHJcbiAgICAgICAgICAgICAgICBlbnZpcm9ubWVudFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5sYW1iZGFzW2lkXSA9IGZuO1xyXG4gICAgICAgICAgICByZXR1cm4gZm47XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIDQuIENyZWF0ZSBBbGwgMjQgTGFtYmRhcyDilIDilIBcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ1dzQ29ubmVjdCcsICdueWF5YS1taXRyYS13cy1jb25uZWN0JywgJ2NoYXQvd2Vic29ja2V0X2Nvbm5lY3QnLCAzMCwgMTI4KTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ1dzRGlzY29ubmVjdCcsICdueWF5YS1taXRyYS13cy1kaXNjb25uZWN0JywgJ2NoYXQvd2Vic29ja2V0X2Rpc2Nvbm5lY3QnLCAxMCwgMTI4KTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ01lc3NhZ2VPcmNoZXN0cmF0b3InLCAnbnlheWEtbWl0cmEtbWVzc2FnZS1vcmNoZXN0cmF0b3InLCAnY2hhdC9tZXNzYWdlX29yY2hlc3RyYXRvcicsIDYwLCA1MTIpO1xyXG4gICAgICAgIGNyZWF0ZUxhbWJkYSgnSW50ZW50Q2xhc3NpZmllcicsICdueWF5YS1taXRyYS1pbnRlbnQtY2xhc3NpZmllcicsICdjaGF0L2ludGVudF9jbGFzc2lmaWVyJywgMzAsIDI1Nik7XHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdSaXNrU2NvcmVyJywgJ255YXlhLW1pdHJhLXJpc2stc2NvcmVyJywgJ2NoYXQvcmlza19zY29yZXInLCAxMCwgMTI4KTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ1MzUmFnUmV0cmlldmVyJywgJ255YXlhLW1pdHJhLXMzLXJhZy1yZXRyaWV2ZXInLCAnY2hhdC9zM19yYWdfcmV0cmlldmVyJywgMzAsIDI1Nik7XHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdCZWRyb2NrR2VuZXJhdG9yJywgJ255YXlhLW1pdHJhLWJlZHJvY2stZ2VuZXJhdG9yJywgJ2NoYXQvYmVkcm9ja19nZW5lcmF0b3InLCA2MCwgMjU2KTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ0NvbmZpZGVuY2VDYWxjdWxhdG9yJywgJ255YXlhLW1pdHJhLWNvbmZpZGVuY2UtY2FsY3VsYXRvcicsICdjaGF0L2NvbmZpZGVuY2VfY2FsY3VsYXRvcicsIDEwLCAxMjgpO1xyXG4gICAgICAgIGNyZWF0ZUxhbWJkYSgnRXNjYWxhdGlvblJvdXRlcicsICdueWF5YS1taXRyYS1lc2NhbGF0aW9uLXJvdXRlcicsICdjaGF0L2VzY2FsYXRpb25fcm91dGVyJywgMzAsIDI1Nik7XHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdGYWN0RXh0cmFjdG9yJywgJ255YXlhLW1pdHJhLWZhY3QtZXh0cmFjdG9yJywgJ2NoYXQvZmFjdF9leHRyYWN0b3InLCA2MCwgMjU2KTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ0FjdGlvblJlY29tbWVuZGVyJywgJ255YXlhLW1pdHJhLWFjdGlvbi1yZWNvbW1lbmRlcicsICdjaGF0L2FjdGlvbl9yZWNvbW1lbmRlcicsIDEwLCAxMjgpO1xyXG5cclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ1Nlc3Npb25IYW5kbGVyJywgJ255YXlhLW1pdHJhLXNlc3Npb24taGFuZGxlcicsICdlbnRyeS9zZXNzaW9uX2hhbmRsZXInLCAzMCwgMTI4KTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ1ZvaWNlSW5wdXQnLCAnbnlheWEtbWl0cmEtdm9pY2UtaW5wdXQnLCAndm9pY2Uvdm9pY2VfaW5wdXRfaGFuZGxlcicsIDYwLCAyNTYpO1xyXG4gICAgICAgIGNyZWF0ZUxhbWJkYSgnVm9pY2VTdGF0dXMnLCAnbnlheWEtbWl0cmEtdm9pY2Utc3RhdHVzJywgJ3ZvaWNlL3ZvaWNlX3N0YXR1c19oYW5kbGVyJywgMzAsIDI1Nik7XHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdUZXh0VG9TcGVlY2gnLCAnbnlheWEtbWl0cmEtdGV4dC10by1zcGVlY2gnLCAndm9pY2UvdGV4dF90b19zcGVlY2gnLCAzMCwgMjU2KTtcclxuXHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdOb3RpY2VTY2FubmVyJywgJ255YXlhLW1pdHJhLW5vdGljZS1zY2FubmVyJywgJ2RvY3VtZW50cy9ub3RpY2Vfc2Nhbm5lcicsIDYwLCA1MTIpO1xyXG4gICAgICAgIGNyZWF0ZUxhbWJkYSgnTm90aWNlQW5hbHlzaXMnLCAnbnlheWEtbWl0cmEtbm90aWNlLWFuYWx5c2lzJywgJ2RvY3VtZW50cy9ub3RpY2VfYW5hbHlzaXMnLCA2MCwgNTEyKTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ0NvbXBsYWludEdlbmVyYXRvcicsICdueWF5YS1taXRyYS1jb21wbGFpbnQtZ2VuZXJhdG9yJywgJ2RvY3VtZW50cy9jb21wbGFpbnRfZ2VuZXJhdG9yJywgNjAsIDUxMik7XHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdDb21wbGFpbnREZWxpdmVyeScsICdueWF5YS1taXRyYS1jb21wbGFpbnQtZGVsaXZlcnknLCAnZG9jdW1lbnRzL2NvbXBsYWludF9kZWxpdmVyeScsIDMwLCAyNTYpO1xyXG4gICAgICAgIGNyZWF0ZUxhbWJkYSgnVGltZWxpbmVCdWlsZGVyJywgJ255YXlhLW1pdHJhLXRpbWVsaW5lLWJ1aWxkZXInLCAnZG9jdW1lbnRzL3RpbWVsaW5lX2J1aWxkZXInLCA2MCwgNTEyKTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ1RpbWVsaW5lUGRmJywgJ255YXlhLW1pdHJhLXRpbWVsaW5lLXBkZi1nZW5lcmF0b3InLCAnZG9jdW1lbnRzL3RpbWVsaW5lX3BkZl9nZW5lcmF0b3InLCA2MCwgNTEyKTtcclxuICAgICAgICBjcmVhdGVMYW1iZGEoJ0Rhc2hib2FyZFdpZGdldHMnLCAnbnlheWEtbWl0cmEtZGFzaGJvYXJkLXdpZGdldHMnLCAnZG9jdW1lbnRzL2Rhc2hib2FyZF93aWRnZXRzJywgMzAsIDI1Nik7XHJcbiAgICAgICAgY3JlYXRlTGFtYmRhKCdEZWFkbGluZVJlbWluZGVyJywgJ255YXlhLW1pdHJhLWRlYWRsaW5lLXJlbWluZGVyJywgJ2RvY3VtZW50cy9kZWFkbGluZV9yZW1pbmRlcicsIDMwLCAyNTYpO1xyXG4gICAgICAgIGNyZWF0ZUxhbWJkYSgnTGVnYWxBaWRFc2NhbGF0b3InLCAnbnlheWEtbWl0cmEtbGVnYWwtYWlkLWVzY2FsYXRvcicsICdkb2N1bWVudHMvbGVnYWxfYWlkX2VzY2FsYXRvcicsIDMwLCAyNTYpO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgNS4gQXR0YWNoIEFQSSBHYXRld2F5IFJvdXRlcyDilIDilIBcclxuXHJcbiAgICAgICAgLy8gSFRUUCBBUEkgUm91dGVzXHJcbiAgICAgICAgcHJvcHMuaHR0cEFwaS5hZGRSb3V0ZXMoe1xyXG4gICAgICAgICAgICBwYXRoOiAnL3YxL2VudHJ5L3Nlc3Npb24nLFxyXG4gICAgICAgICAgICBtZXRob2RzOiBbYXBpZ2F0ZXdheXYyLkh0dHBNZXRob2QuUE9TVF0sXHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgSHR0cExhbWJkYUludGVncmF0aW9uKCdTZXNzaW9uSW50JywgdGhpcy5sYW1iZGFzWydTZXNzaW9uSGFuZGxlciddKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb3BzLmh0dHBBcGkuYWRkUm91dGVzKHtcclxuICAgICAgICAgICAgcGF0aDogJy92MS92b2ljZS9pbnB1dCcsXHJcbiAgICAgICAgICAgIG1ldGhvZHM6IFthcGlnYXRld2F5djIuSHR0cE1ldGhvZC5QT1NUXSxcclxuICAgICAgICAgICAgaW50ZWdyYXRpb246IG5ldyBIdHRwTGFtYmRhSW50ZWdyYXRpb24oJ1ZvaWNlSW5wdXRJbnQnLCB0aGlzLmxhbWJkYXNbJ1ZvaWNlSW5wdXQnXSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBwcm9wcy5odHRwQXBpLmFkZFJvdXRlcyh7XHJcbiAgICAgICAgICAgIHBhdGg6ICcvdjEvdm9pY2Uvc3RhdHVzJyxcclxuICAgICAgICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXl2Mi5IdHRwTWV0aG9kLkdFVF0sXHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgSHR0cExhbWJkYUludGVncmF0aW9uKCdWb2ljZVN0YXR1c0ludCcsIHRoaXMubGFtYmRhc1snVm9pY2VTdGF0dXMnXSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBwcm9wcy5odHRwQXBpLmFkZFJvdXRlcyh7XHJcbiAgICAgICAgICAgIHBhdGg6ICcvdjEvdm9pY2Uvb3V0cHV0JyxcclxuICAgICAgICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXl2Mi5IdHRwTWV0aG9kLlBPU1RdLFxyXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IEh0dHBMYW1iZGFJbnRlZ3JhdGlvbignVm9pY2VPdXRwdXRJbnQnLCB0aGlzLmxhbWJkYXNbJ1RleHRUb1NwZWVjaCddKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb3BzLmh0dHBBcGkuYWRkUm91dGVzKHtcclxuICAgICAgICAgICAgcGF0aDogJy92MS90aW1lbGluZS9leHRyYWN0JyxcclxuICAgICAgICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXl2Mi5IdHRwTWV0aG9kLlBPU1RdLFxyXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IEh0dHBMYW1iZGFJbnRlZ3JhdGlvbignVGltZWxpbmVFeHRyYWN0SW50JywgdGhpcy5sYW1iZGFzWydUaW1lbGluZUJ1aWxkZXInXSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBwcm9wcy5odHRwQXBpLmFkZFJvdXRlcyh7XHJcbiAgICAgICAgICAgIHBhdGg6ICcvdjEvdGltZWxpbmUvZXhwb3J0JyxcclxuICAgICAgICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXl2Mi5IdHRwTWV0aG9kLlBPU1RdLFxyXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IEh0dHBMYW1iZGFJbnRlZ3JhdGlvbignVGltZWxpbmVQZGZJbnQnLCB0aGlzLmxhbWJkYXNbJ1RpbWVsaW5lUGRmJ10pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvcHMuaHR0cEFwaS5hZGRSb3V0ZXMoe1xyXG4gICAgICAgICAgICBwYXRoOiAnL3YxL2NvbXBsYWludHMvZ2VuZXJhdGUnLFxyXG4gICAgICAgICAgICBtZXRob2RzOiBbYXBpZ2F0ZXdheXYyLkh0dHBNZXRob2QuUE9TVF0sXHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgSHR0cExhbWJkYUludGVncmF0aW9uKCdDb21wbGFpbnRHZW5JbnQnLCB0aGlzLmxhbWJkYXNbJ0NvbXBsYWludEdlbmVyYXRvciddKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb3BzLmh0dHBBcGkuYWRkUm91dGVzKHtcclxuICAgICAgICAgICAgcGF0aDogJy92MS9jb21wbGFpbnRzL2RlbGl2ZXInLFxyXG4gICAgICAgICAgICBtZXRob2RzOiBbYXBpZ2F0ZXdheXYyLkh0dHBNZXRob2QuUE9TVF0sXHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgSHR0cExhbWJkYUludGVncmF0aW9uKCdDb21wbGFpbnREZWxJbnQnLCB0aGlzLmxhbWJkYXNbJ0NvbXBsYWludERlbGl2ZXJ5J10pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvcHMuaHR0cEFwaS5hZGRSb3V0ZXMoe1xyXG4gICAgICAgICAgICBwYXRoOiAnL3YxL25vdGljZXMvdXBsb2FkJyxcclxuICAgICAgICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXl2Mi5IdHRwTWV0aG9kLlBPU1RdLFxyXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IEh0dHBMYW1iZGFJbnRlZ3JhdGlvbignTm90aWNlVXBsb2FkSW50JywgdGhpcy5sYW1iZGFzWydOb3RpY2VTY2FubmVyJ10pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvcHMuaHR0cEFwaS5hZGRSb3V0ZXMoe1xyXG4gICAgICAgICAgICBwYXRoOiAnL3YxL25vdGljZXMve25vdGljZV9pZH0vYW5hbHlzaXMnLFxyXG4gICAgICAgICAgICBtZXRob2RzOiBbYXBpZ2F0ZXdheXYyLkh0dHBNZXRob2QuR0VUXSxcclxuICAgICAgICAgICAgaW50ZWdyYXRpb246IG5ldyBIdHRwTGFtYmRhSW50ZWdyYXRpb24oJ05vdGljZUFuYWx5c2lzSW50JywgdGhpcy5sYW1iZGFzWydOb3RpY2VTY2FubmVyJ10pIC8vIE5vdGljZVNjYW5uZXIgaGFuZGxlcyBib3RoIEdFVCBhbmQgUE9TVFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb3BzLmh0dHBBcGkuYWRkUm91dGVzKHtcclxuICAgICAgICAgICAgcGF0aDogJy92MS9sZWdhbC1haWQvZXNjYWxhdGUnLFxyXG4gICAgICAgICAgICBtZXRob2RzOiBbYXBpZ2F0ZXdheXYyLkh0dHBNZXRob2QuUE9TVF0sXHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgSHR0cExhbWJkYUludGVncmF0aW9uKCdMZWdhbEFpZEVzY0ludCcsIHRoaXMubGFtYmRhc1snTGVnYWxBaWRFc2NhbGF0b3InXSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBwcm9wcy5odHRwQXBpLmFkZFJvdXRlcyh7XHJcbiAgICAgICAgICAgIHBhdGg6ICcvdjEvbGVnYWwtYWlkL3JlZmVycmFscycsXHJcbiAgICAgICAgICAgIG1ldGhvZHM6IFthcGlnYXRld2F5djIuSHR0cE1ldGhvZC5HRVRdLFxyXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IEh0dHBMYW1iZGFJbnRlZ3JhdGlvbignTGVnYWxBaWRSZWZJbnQnLCB0aGlzLmxhbWJkYXNbJ0xlZ2FsQWlkRXNjYWxhdG9yJ10pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvcHMuaHR0cEFwaS5hZGRSb3V0ZXMoe1xyXG4gICAgICAgICAgICBwYXRoOiAnL3YxL2Rhc2hib2FyZC93aWRnZXRzJyxcclxuICAgICAgICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXl2Mi5IdHRwTWV0aG9kLkdFVF0sXHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgSHR0cExhbWJkYUludGVncmF0aW9uKCdEYXNoYm9hcmRJbnQnLCB0aGlzLmxhbWJkYXNbJ0Rhc2hib2FyZFdpZGdldHMnXSlcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gV2ViU29ja2V0IEFQSSBSb3V0ZXNcclxuICAgICAgICBwcm9wcy53ZWJTb2NrZXRBcGkuYWRkUm91dGUoJyRjb25uZWN0Jywge1xyXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IFdlYlNvY2tldExhbWJkYUludGVncmF0aW9uKCdXc0Nvbm5lY3RJbnQnLCB0aGlzLmxhbWJkYXNbJ1dzQ29ubmVjdCddKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb3BzLndlYlNvY2tldEFwaS5hZGRSb3V0ZSgnJGRpc2Nvbm5lY3QnLCB7XHJcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgV2ViU29ja2V0TGFtYmRhSW50ZWdyYXRpb24oJ1dzRGlzY29ubmVjdEludCcsIHRoaXMubGFtYmRhc1snV3NEaXNjb25uZWN0J10pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvcHMud2ViU29ja2V0QXBpLmFkZFJvdXRlKCdzZW5kTWVzc2FnZScsIHtcclxuICAgICAgICAgICAgaW50ZWdyYXRpb246IG5ldyBXZWJTb2NrZXRMYW1iZGFJbnRlZ3JhdGlvbignV3NNZXNzYWdlSW50JywgdGhpcy5sYW1iZGFzWydNZXNzYWdlT3JjaGVzdHJhdG9yJ10pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19