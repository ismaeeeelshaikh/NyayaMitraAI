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
exports.DataStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
class DataStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.tables = {};
        this.buckets = {};
        // ════════════════════════════════════════════
        //              DYNAMODB TABLES
        // ════════════════════════════════════════════
        // TABLE 1: Users
        // User profiles store karta hai
        this.tables.users = new dynamodb.Table(this, 'Users', {
            tableName: 'nyaya-mitra-users',
            partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN // User data kabhi delete nahi
        });
        // TABLE 2: Sessions
        // Har conversation ka session — TTL se auto-delete
        this.tables.sessions = new dynamodb.Table(this, 'Sessions', {
            tableName: 'nyaya-mitra-sessions',
            partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            timeToLiveAttribute: 'ttl', // Guest: 24h, Registered: 7 days
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // user_id se sessions dhundhne ke liye
        this.tables.sessions.addGlobalSecondaryIndex({
            indexName: 'user-index',
            partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 3: Chat History
        // Har message store hoga
        this.tables.chatHistory = new dynamodb.Table(this, 'ChatHistory', {
            tableName: 'nyaya-mitra-chat-history',
            partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            timeToLiveAttribute: 'ttl', // Guest: 24h, Registered: 90 days
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // TABLE 4: Connections (WebSocket)
        // Active WebSocket connections track karta hai
        this.tables.connections = new dynamodb.Table(this, 'Connections', {
            tableName: 'nyaya-mitra-connections',
            partitionKey: { name: 'connection_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: 'ttl', // 2 hours
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.tables.connections.addGlobalSecondaryIndex({
            indexName: 'session-index',
            partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 5: Risk Assessments
        // Har session ka risk score history
        this.tables.riskAssessments = new dynamodb.Table(this, 'RiskAssessments', {
            tableName: 'nyaya-mitra-risk-assessments',
            partitionKey: { name: 'assessment_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.tables.riskAssessments.addGlobalSecondaryIndex({
            indexName: 'session-index',
            partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 6: Timelines
        // User ke case ki chronological timeline
        this.tables.timelines = new dynamodb.Table(this, 'Timelines', {
            tableName: 'nyaya-mitra-timelines',
            partitionKey: { name: 'timeline_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.tables.timelines.addGlobalSecondaryIndex({
            indexName: 'user-index',
            partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 7: Complaints
        // Generated complaint documents
        this.tables.complaints = new dynamodb.Table(this, 'Complaints', {
            tableName: 'nyaya-mitra-complaints',
            partitionKey: { name: 'complaint_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.tables.complaints.addGlobalSecondaryIndex({
            indexName: 'user-index',
            partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING }
        });
        this.tables.complaints.addGlobalSecondaryIndex({
            indexName: 'tracking-index',
            partitionKey: { name: 'tracking_number', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 8: Scanned Notices
        // Uploaded aur analyzed legal notices
        this.tables.scannedNotices = new dynamodb.Table(this, 'ScannedNotices', {
            tableName: 'nyaya-mitra-scanned-notices',
            partitionKey: { name: 'notice_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.tables.scannedNotices.addGlobalSecondaryIndex({
            indexName: 'user-index',
            partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING }
        });
        this.tables.scannedNotices.addGlobalSecondaryIndex({
            indexName: 'deadline-index',
            partitionKey: { name: 'deadline_status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'response_deadline_date', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 9: Legal Aid Partners
        // Registered legal aid organizations
        this.tables.legalAidPartners = new dynamodb.Table(this, 'LegalAidPartners', {
            tableName: 'nyaya-mitra-legal-aid-partners',
            partitionKey: { name: 'partner_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN // Important data
        });
        this.tables.legalAidPartners.addGlobalSecondaryIndex({
            indexName: 'state-district-index',
            partitionKey: { name: 'state', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'district', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 10: Escalation Logs
        // HIGH risk cases ke alerts
        this.tables.escalationLogs = new dynamodb.Table(this, 'EscalationLogs', {
            tableName: 'nyaya-mitra-escalation-logs',
            partitionKey: { name: 'escalation_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.tables.escalationLogs.addGlobalSecondaryIndex({
            indexName: 'user-index',
            partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING }
        });
        // TABLE 11: Case Referrals
        // Legal aid partner ko case refer karna
        this.tables.caseReferrals = new dynamodb.Table(this, 'CaseReferrals', {
            tableName: 'nyaya-mitra-case-referrals',
            partitionKey: { name: 'referral_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // TABLE 12: Complaint Analytics
        // Dashboard mein popular issues dikhane ke liye
        this.tables.complaintAnalytics = new dynamodb.Table(this, 'ComplaintAnalytics', {
            tableName: 'nyaya-mitra-complaint-analytics',
            partitionKey: { name: 'state_district', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // ════════════════════════════════════════════
        //                 S3 BUCKETS
        // ════════════════════════════════════════════
        // BUCKET 1: Frontend
        // React app yahan deploy hogi
        this.buckets.frontend = new s3.Bucket(this, 'Frontend', {
            bucketName: `nyaya-mitra-frontend-${this.account}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });
        // BUCKET 2: Legal Corpus (Kendra replace)
        // Legal .txt documents yahan rakhe jayenge
        this.buckets.legalCorpus = new s3.Bucket(this, 'LegalCorpus', {
            bucketName: `nyaya-mitra-legal-corpus-${this.account}`,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: props.kmsKey,
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        // BUCKET 3: User Documents (generated PDFs)
        // Complaints aur timelines ke PDFs
        this.buckets.userDocuments = new s3.Bucket(this, 'UserDocuments', {
            bucketName: `nyaya-mitra-user-documents-${this.account}`,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: props.kmsKey,
            lifecycleRules: [{
                    id: 'DeleteAfter1Year',
                    enabled: true,
                    expiration: cdk.Duration.days(365)
                }],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        // BUCKET 4: User Uploads (notice uploads, evidence)
        // Users yahan apne documents upload karenge
        this.buckets.userUploads = new s3.Bucket(this, 'UserUploads', {
            bucketName: `nyaya-mitra-user-uploads-${this.account}`,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: props.kmsKey,
            cors: [{
                    allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
                    allowedOrigins: ['http://localhost:5173', 'https://nyayamitra.in'],
                    allowedHeaders: ['*'],
                    maxAge: 3000
                }],
            lifecycleRules: [{
                    id: 'DeleteAfter90Days',
                    enabled: true,
                    expiration: cdk.Duration.days(90)
                }],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        // BUCKET 5: Templates
        // Complaint templates store
        this.buckets.templates = new s3.Bucket(this, 'Templates', {
            bucketName: `nyaya-mitra-templates-${this.account}`,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: props.kmsKey,
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        // ── Outputs ──
        new cdk.CfnOutput(this, 'FrontendBucket', { value: this.buckets.frontend.bucketName, exportName: 'NyayaFrontendBucket' });
        new cdk.CfnOutput(this, 'LegalCorpusBucket', { value: this.buckets.legalCorpus.bucketName, exportName: 'NyayaLegalCorpusBucket' });
        new cdk.CfnOutput(this, 'UserDocsBucket', { value: this.buckets.userDocuments.bucketName, exportName: 'NyayaUserDocsBucket' });
        new cdk.CfnOutput(this, 'UserUploadsBucket', { value: this.buckets.userUploads.bucketName, exportName: 'NyayaUserUploadsBucket' });
    }
}
exports.DataStack = DataStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLG1FQUFxRDtBQUNyRCx1REFBeUM7QUFRekMsTUFBYSxTQUFVLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJcEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFxQjtRQUMzRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUpaLFdBQU0sR0FBc0MsRUFBRSxDQUFDO1FBQy9DLFlBQU8sR0FBaUMsRUFBRSxDQUFDO1FBS3ZELCtDQUErQztRQUMvQywrQkFBK0I7UUFDL0IsK0NBQStDO1FBRS9DLGlCQUFpQjtRQUNqQixnQ0FBZ0M7UUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDbEQsU0FBUyxFQUFFLG1CQUFtQjtZQUM5QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN0RSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLGdCQUFnQjtZQUNyRCxhQUFhLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDM0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUUsOEJBQThCO1NBQzFFLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElB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RSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7UUFDMUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQztRQUNuSSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQy9ILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSx3QkFBd0IsRUFBRSxDQUFDLENBQUM7SUFDdkksQ0FBQztDQUNKO0FBcFFELDhCQW9RQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgRGF0YVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgICBrbXNLZXk6IGttcy5LZXk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEYXRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHRhYmxlczogeyBba2V5OiBzdHJpbmddOiBkeW5hbW9kYi5UYWJsZSB9ID0ge307XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0czogeyBba2V5OiBzdHJpbmddOiBzMy5CdWNrZXQgfSA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBEYXRhU3RhY2tQcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgICAgICAvLyDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZBcclxuICAgICAgICAvLyAgICAgICAgICAgICAgRFlOQU1PREIgVEFCTEVTXHJcbiAgICAgICAgLy8g4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQXHJcblxyXG4gICAgICAgIC8vIFRBQkxFIDE6IFVzZXJzXHJcbiAgICAgICAgLy8gVXNlciBwcm9maWxlcyBzdG9yZSBrYXJ0YSBoYWlcclxuICAgICAgICB0aGlzLnRhYmxlcy51c2VycyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnVXNlcnMnLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogJ255YXlhLW1pdHJhLXVzZXJzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IHByb3BzLmttc0tleSxcclxuICAgICAgICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOICAvLyBVc2VyIGRhdGEga2FiaGkgZGVsZXRlIG5haGlcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgMjogU2Vzc2lvbnNcclxuICAgICAgICAvLyBIYXIgY29udmVyc2F0aW9uIGthIHNlc3Npb24g4oCUIFRUTCBzZSBhdXRvLWRlbGV0ZVxyXG4gICAgICAgIHRoaXMudGFibGVzLnNlc3Npb25zID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTZXNzaW9ucycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtc2Vzc2lvbnMnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Nlc3Npb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgIC8vIEd1ZXN0OiAyNGgsIFJlZ2lzdGVyZWQ6IDcgZGF5c1xyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gdXNlcl9pZCBzZSBzZXNzaW9ucyBkaHVuZGhuZSBrZSBsaXllXHJcbiAgICAgICAgdGhpcy50YWJsZXMuc2Vzc2lvbnMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICd1c2VyLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSAzOiBDaGF0IEhpc3RvcnlcclxuICAgICAgICAvLyBIYXIgbWVzc2FnZSBzdG9yZSBob2dhXHJcbiAgICAgICAgdGhpcy50YWJsZXMuY2hhdEhpc3RvcnkgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0NoYXRIaXN0b3J5Jywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1jaGF0LWhpc3RvcnknLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Nlc3Npb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICd0aW1lc3RhbXAnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgIC8vIEd1ZXN0OiAyNGgsIFJlZ2lzdGVyZWQ6IDkwIGRheXNcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSA0OiBDb25uZWN0aW9ucyAoV2ViU29ja2V0KVxyXG4gICAgICAgIC8vIEFjdGl2ZSBXZWJTb2NrZXQgY29ubmVjdGlvbnMgdHJhY2sga2FydGEgaGFpXHJcbiAgICAgICAgdGhpcy50YWJsZXMuY29ubmVjdGlvbnMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0Nvbm5lY3Rpb25zJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1jb25uZWN0aW9ucycsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY29ubmVjdGlvbl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAgLy8gMiBob3Vyc1xyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMuY29ubmVjdGlvbnMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICdzZXNzaW9uLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzZXNzaW9uX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSA1OiBSaXNrIEFzc2Vzc21lbnRzXHJcbiAgICAgICAgLy8gSGFyIHNlc3Npb24ga2EgcmlzayBzY29yZSBoaXN0b3J5XHJcbiAgICAgICAgdGhpcy50YWJsZXMucmlza0Fzc2Vzc21lbnRzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdSaXNrQXNzZXNzbWVudHMnLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogJ255YXlhLW1pdHJhLXJpc2stYXNzZXNzbWVudHMnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2Fzc2Vzc21lbnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMucmlza0Fzc2Vzc21lbnRzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAnc2Vzc2lvbi1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc2Vzc2lvbl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgNjogVGltZWxpbmVzXHJcbiAgICAgICAgLy8gVXNlciBrZSBjYXNlIGtpIGNocm9ub2xvZ2ljYWwgdGltZWxpbmVcclxuICAgICAgICB0aGlzLnRhYmxlcy50aW1lbGluZXMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1RpbWVsaW5lcycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtdGltZWxpbmVzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd0aW1lbGluZV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5OiBwcm9wcy5rbXNLZXksXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnRhYmxlcy50aW1lbGluZXMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICd1c2VyLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSA3OiBDb21wbGFpbnRzXHJcbiAgICAgICAgLy8gR2VuZXJhdGVkIGNvbXBsYWludCBkb2N1bWVudHNcclxuICAgICAgICB0aGlzLnRhYmxlcy5jb21wbGFpbnRzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDb21wbGFpbnRzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1jb21wbGFpbnRzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdjb21wbGFpbnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMuY29tcGxhaW50cy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgICAgICAgIGluZGV4TmFtZTogJ3VzZXItaW5kZXgnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMuY29tcGxhaW50cy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgICAgICAgIGluZGV4TmFtZTogJ3RyYWNraW5nLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd0cmFja2luZ19udW1iZXInLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRBQkxFIDg6IFNjYW5uZWQgTm90aWNlc1xyXG4gICAgICAgIC8vIFVwbG9hZGVkIGF1ciBhbmFseXplZCBsZWdhbCBub3RpY2VzXHJcbiAgICAgICAgdGhpcy50YWJsZXMuc2Nhbm5lZE5vdGljZXMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NjYW5uZWROb3RpY2VzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1zY2FubmVkLW5vdGljZXMnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ25vdGljZV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5OiBwcm9wcy5rbXNLZXksXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnRhYmxlcy5zY2FubmVkTm90aWNlcy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgICAgICAgIGluZGV4TmFtZTogJ3VzZXItaW5kZXgnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMuc2Nhbm5lZE5vdGljZXMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICdkZWFkbGluZS1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZGVhZGxpbmVfc3RhdHVzJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgc29ydEtleTogeyBuYW1lOiAncmVzcG9uc2VfZGVhZGxpbmVfZGF0ZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgOTogTGVnYWwgQWlkIFBhcnRuZXJzXHJcbiAgICAgICAgLy8gUmVnaXN0ZXJlZCBsZWdhbCBhaWQgb3JnYW5pemF0aW9uc1xyXG4gICAgICAgIHRoaXMudGFibGVzLmxlZ2FsQWlkUGFydG5lcnMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0xlZ2FsQWlkUGFydG5lcnMnLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogJ255YXlhLW1pdHJhLWxlZ2FsLWFpZC1wYXJ0bmVycycsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncGFydG5lcl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiAgLy8gSW1wb3J0YW50IGRhdGFcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnRhYmxlcy5sZWdhbEFpZFBhcnRuZXJzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAnc3RhdGUtZGlzdHJpY3QtaW5kZXgnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3N0YXRlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnZGlzdHJpY3QnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRBQkxFIDEwOiBFc2NhbGF0aW9uIExvZ3NcclxuICAgICAgICAvLyBISUdIIHJpc2sgY2FzZXMga2UgYWxlcnRzXHJcbiAgICAgICAgdGhpcy50YWJsZXMuZXNjYWxhdGlvbkxvZ3MgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0VzY2FsYXRpb25Mb2dzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1lc2NhbGF0aW9uLWxvZ3MnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2VzY2FsYXRpb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMuZXNjYWxhdGlvbkxvZ3MuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICd1c2VyLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSAxMTogQ2FzZSBSZWZlcnJhbHNcclxuICAgICAgICAvLyBMZWdhbCBhaWQgcGFydG5lciBrbyBjYXNlIHJlZmVyIGthcm5hXHJcbiAgICAgICAgdGhpcy50YWJsZXMuY2FzZVJlZmVycmFscyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQ2FzZVJlZmVycmFscycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtY2FzZS1yZWZlcnJhbHMnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3JlZmVycmFsX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSAxMjogQ29tcGxhaW50IEFuYWx5dGljc1xyXG4gICAgICAgIC8vIERhc2hib2FyZCBtZWluIHBvcHVsYXIgaXNzdWVzIGRpa2hhbmUga2UgbGl5ZVxyXG4gICAgICAgIHRoaXMudGFibGVzLmNvbXBsYWludEFuYWx5dGljcyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQ29tcGxhaW50QW5hbHl0aWNzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1jb21wbGFpbnQtYW5hbHl0aWNzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0ZV9kaXN0cmljdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RpbWVzdGFtcCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIFMzIEJVQ0tFVFNcclxuICAgICAgICAvLyDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZBcclxuXHJcbiAgICAgICAgLy8gQlVDS0VUIDE6IEZyb250ZW5kXHJcbiAgICAgICAgLy8gUmVhY3QgYXBwIHlhaGFuIGRlcGxveSBob2dpXHJcbiAgICAgICAgdGhpcy5idWNrZXRzLmZyb250ZW5kID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnRnJvbnRlbmQnLCB7XHJcbiAgICAgICAgICAgIGJ1Y2tldE5hbWU6IGBueWF5YS1taXRyYS1mcm9udGVuZC0ke3RoaXMuYWNjb3VudH1gLFxyXG4gICAgICAgICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcclxuICAgICAgICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcclxuICAgICAgICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcclxuICAgICAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQlVDS0VUIDI6IExlZ2FsIENvcnB1cyAoS2VuZHJhIHJlcGxhY2UpXHJcbiAgICAgICAgLy8gTGVnYWwgLnR4dCBkb2N1bWVudHMgeWFoYW4gcmFraGUgamF5ZW5nZVxyXG4gICAgICAgIHRoaXMuYnVja2V0cy5sZWdhbENvcnB1cyA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0xlZ2FsQ29ycHVzJywge1xyXG4gICAgICAgICAgICBidWNrZXROYW1lOiBgbnlheWEtbWl0cmEtbGVnYWwtY29ycHVzLSR7dGhpcy5hY2NvdW50fWAsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5OiBwcm9wcy5rbXNLZXksXHJcbiAgICAgICAgICAgIHZlcnNpb25lZDogdHJ1ZSxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEJVQ0tFVCAzOiBVc2VyIERvY3VtZW50cyAoZ2VuZXJhdGVkIFBERnMpXHJcbiAgICAgICAgLy8gQ29tcGxhaW50cyBhdXIgdGltZWxpbmVzIGtlIFBERnNcclxuICAgICAgICB0aGlzLmJ1Y2tldHMudXNlckRvY3VtZW50cyA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1VzZXJEb2N1bWVudHMnLCB7XHJcbiAgICAgICAgICAgIGJ1Y2tldE5hbWU6IGBueWF5YS1taXRyYS11c2VyLWRvY3VtZW50cy0ke3RoaXMuYWNjb3VudH1gLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICBsaWZlY3ljbGVSdWxlczogW3tcclxuICAgICAgICAgICAgICAgIGlkOiAnRGVsZXRlQWZ0ZXIxWWVhcicsXHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMzY1KVxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcclxuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBCVUNLRVQgNDogVXNlciBVcGxvYWRzIChub3RpY2UgdXBsb2FkcywgZXZpZGVuY2UpXHJcbiAgICAgICAgLy8gVXNlcnMgeWFoYW4gYXBuZSBkb2N1bWVudHMgdXBsb2FkIGthcmVuZ2VcclxuICAgICAgICB0aGlzLmJ1Y2tldHMudXNlclVwbG9hZHMgPSBuZXcgczMuQnVja2V0KHRoaXMsICdVc2VyVXBsb2FkcycsIHtcclxuICAgICAgICAgICAgYnVja2V0TmFtZTogYG55YXlhLW1pdHJhLXVzZXItdXBsb2Fkcy0ke3RoaXMuYWNjb3VudH1gLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICBjb3JzOiBbe1xuICAgICAgICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuUFVULCBzMy5IdHRwTWV0aG9kcy5QT1NULCBzMy5IdHRwTWV0aG9kcy5HRVRdLFxuICAgICAgICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6NTE3MycsICdodHRwczovL255YXlhbWl0cmEuaW4nXSxcbiAgICAgICAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICAgICAgICAgICAgbWF4QWdlOiAzMDAwXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbe1xyXG4gICAgICAgICAgICAgICAgaWQ6ICdEZWxldGVBZnRlcjkwRGF5cycsXHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoOTApXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEJVQ0tFVCA1OiBUZW1wbGF0ZXNcclxuICAgICAgICAvLyBDb21wbGFpbnQgdGVtcGxhdGVzIHN0b3JlXHJcbiAgICAgICAgdGhpcy5idWNrZXRzLnRlbXBsYXRlcyA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1RlbXBsYXRlcycsIHtcclxuICAgICAgICAgICAgYnVja2V0TmFtZTogYG55YXlhLW1pdHJhLXRlbXBsYXRlcy0ke3RoaXMuYWNjb3VudH1gLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICB2ZXJzaW9uZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgT3V0cHV0cyDilIDilIBcclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRnJvbnRlbmRCdWNrZXQnLCB7IHZhbHVlOiB0aGlzLmJ1Y2tldHMuZnJvbnRlbmQuYnVja2V0TmFtZSwgZXhwb3J0TmFtZTogJ055YXlhRnJvbnRlbmRCdWNrZXQnIH0pO1xyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMZWdhbENvcnB1c0J1Y2tldCcsIHsgdmFsdWU6IHRoaXMuYnVja2V0cy5sZWdhbENvcnB1cy5idWNrZXROYW1lLCBleHBvcnROYW1lOiAnTnlheWFMZWdhbENvcnB1c0J1Y2tldCcgfSk7XHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJEb2NzQnVja2V0JywgeyB2YWx1ZTogdGhpcy5idWNrZXRzLnVzZXJEb2N1bWVudHMuYnVja2V0TmFtZSwgZXhwb3J0TmFtZTogJ055YXlhVXNlckRvY3NCdWNrZXQnIH0pO1xyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyVXBsb2Fkc0J1Y2tldCcsIHsgdmFsdWU6IHRoaXMuYnVja2V0cy51c2VyVXBsb2Fkcy5idWNrZXROYW1lLCBleHBvcnROYW1lOiAnTnlheWFVc2VyVXBsb2Fkc0J1Y2tldCcgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19