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
                    allowedOrigins: ['http://localhost:5173', 'https://nyayamitra.in', '*'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLG1FQUFxRDtBQUNyRCx1REFBeUM7QUFRekMsTUFBYSxTQUFVLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJcEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFxQjtRQUMzRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUpaLFdBQU0sR0FBc0MsRUFBRSxDQUFDO1FBQy9DLFlBQU8sR0FBaUMsRUFBRSxDQUFDO1FBS3ZELCtDQUErQztRQUMvQywrQkFBK0I7UUFDL0IsK0NBQStDO1FBRS9DLGlCQUFpQjtRQUNqQixnQ0FBZ0M7UUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDbEQsU0FBUyxFQUFFLG1CQUFtQjtZQUM5QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN0RSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLGdCQUFnQjtZQUNyRCxhQUFhLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDM0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUUsOEJBQThCO1NBQzFFLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElB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QixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQzFILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSx3QkFBd0IsRUFBRSxDQUFDLENBQUM7UUFDbkksSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztRQUMvSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZJLENBQUM7Q0FDSjtBQXBRRCw4QkFvUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xyXG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xyXG5pbXBvcnQgKiBhcyBrbXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWttcyc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuaW50ZXJmYWNlIERhdGFTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xyXG4gICAga21zS2V5OiBrbXMuS2V5O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGF0YVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICAgIHB1YmxpYyByZWFkb25seSB0YWJsZXM6IHsgW2tleTogc3RyaW5nXTogZHluYW1vZGIuVGFibGUgfSA9IHt9O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldHM6IHsgW2tleTogc3RyaW5nXTogczMuQnVja2V0IH0gPSB7fTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRGF0YVN0YWNrUHJvcHMpIHtcclxuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAgICAgLy8g4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgIERZTkFNT0RCIFRBQkxFU1xyXG4gICAgICAgIC8vIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkFxyXG5cclxuICAgICAgICAvLyBUQUJMRSAxOiBVc2Vyc1xyXG4gICAgICAgIC8vIFVzZXIgcHJvZmlsZXMgc3RvcmUga2FydGEgaGFpXHJcbiAgICAgICAgdGhpcy50YWJsZXMudXNlcnMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1VzZXJzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS11c2VycycsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5OiBwcm9wcy5rbXNLZXksXHJcbiAgICAgICAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiAgLy8gVXNlciBkYXRhIGthYmhpIGRlbGV0ZSBuYWhpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRBQkxFIDI6IFNlc3Npb25zXHJcbiAgICAgICAgLy8gSGFyIGNvbnZlcnNhdGlvbiBrYSBzZXNzaW9uIOKAlCBUVEwgc2UgYXV0by1kZWxldGVcclxuICAgICAgICB0aGlzLnRhYmxlcy5zZXNzaW9ucyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnU2Vzc2lvbnMnLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogJ255YXlhLW1pdHJhLXNlc3Npb25zJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzZXNzaW9uX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IHByb3BzLmttc0tleSxcclxuICAgICAgICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsICAvLyBHdWVzdDogMjRoLCBSZWdpc3RlcmVkOiA3IGRheXNcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIHVzZXJfaWQgc2Ugc2Vzc2lvbnMgZGh1bmRobmUga2UgbGl5ZVxyXG4gICAgICAgIHRoaXMudGFibGVzLnNlc3Npb25zLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAndXNlci1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgMzogQ2hhdCBIaXN0b3J5XHJcbiAgICAgICAgLy8gSGFyIG1lc3NhZ2Ugc3RvcmUgaG9nYVxyXG4gICAgICAgIHRoaXMudGFibGVzLmNoYXRIaXN0b3J5ID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDaGF0SGlzdG9yeScsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtY2hhdC1oaXN0b3J5JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzZXNzaW9uX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgc29ydEtleTogeyBuYW1lOiAndGltZXN0YW1wJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IHByb3BzLmttc0tleSxcclxuICAgICAgICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsICAvLyBHdWVzdDogMjRoLCBSZWdpc3RlcmVkOiA5MCBkYXlzXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgNDogQ29ubmVjdGlvbnMgKFdlYlNvY2tldClcclxuICAgICAgICAvLyBBY3RpdmUgV2ViU29ja2V0IGNvbm5lY3Rpb25zIHRyYWNrIGthcnRhIGhhaVxyXG4gICAgICAgIHRoaXMudGFibGVzLmNvbm5lY3Rpb25zID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDb25uZWN0aW9ucycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtY29ubmVjdGlvbnMnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2Nvbm5lY3Rpb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgIC8vIDIgaG91cnNcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudGFibGVzLmNvbm5lY3Rpb25zLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAnc2Vzc2lvbi1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc2Vzc2lvbl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgNTogUmlzayBBc3Nlc3NtZW50c1xyXG4gICAgICAgIC8vIEhhciBzZXNzaW9uIGthIHJpc2sgc2NvcmUgaGlzdG9yeVxyXG4gICAgICAgIHRoaXMudGFibGVzLnJpc2tBc3Nlc3NtZW50cyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnUmlza0Fzc2Vzc21lbnRzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1yaXNrLWFzc2Vzc21lbnRzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhc3Nlc3NtZW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudGFibGVzLnJpc2tBc3Nlc3NtZW50cy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgICAgICAgIGluZGV4TmFtZTogJ3Nlc3Npb24taW5kZXgnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Nlc3Npb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRBQkxFIDY6IFRpbWVsaW5lc1xyXG4gICAgICAgIC8vIFVzZXIga2UgY2FzZSBraSBjaHJvbm9sb2dpY2FsIHRpbWVsaW5lXHJcbiAgICAgICAgdGhpcy50YWJsZXMudGltZWxpbmVzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdUaW1lbGluZXMnLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogJ255YXlhLW1pdHJhLXRpbWVsaW5lcycsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndGltZWxpbmVfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMudGltZWxpbmVzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAndXNlci1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgNzogQ29tcGxhaW50c1xyXG4gICAgICAgIC8vIEdlbmVyYXRlZCBjb21wbGFpbnQgZG9jdW1lbnRzXHJcbiAgICAgICAgdGhpcy50YWJsZXMuY29tcGxhaW50cyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQ29tcGxhaW50cycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtY29tcGxhaW50cycsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY29tcGxhaW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IHByb3BzLmttc0tleSxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudGFibGVzLmNvbXBsYWludHMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICd1c2VyLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudGFibGVzLmNvbXBsYWludHMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICd0cmFja2luZy1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndHJhY2tpbmdfbnVtYmVyJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSA4OiBTY2FubmVkIE5vdGljZXNcclxuICAgICAgICAvLyBVcGxvYWRlZCBhdXIgYW5hbHl6ZWQgbGVnYWwgbm90aWNlc1xyXG4gICAgICAgIHRoaXMudGFibGVzLnNjYW5uZWROb3RpY2VzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTY2FubmVkTm90aWNlcycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtc2Nhbm5lZC1ub3RpY2VzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdub3RpY2VfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMuc2Nhbm5lZE5vdGljZXMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICAgICAgICBpbmRleE5hbWU6ICd1c2VyLWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudGFibGVzLnNjYW5uZWROb3RpY2VzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAnZGVhZGxpbmUtaW5kZXgnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2RlYWRsaW5lX3N0YXR1cycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3Jlc3BvbnNlX2RlYWRsaW5lX2RhdGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRBQkxFIDk6IExlZ2FsIEFpZCBQYXJ0bmVyc1xyXG4gICAgICAgIC8vIFJlZ2lzdGVyZWQgbGVnYWwgYWlkIG9yZ2FuaXphdGlvbnNcclxuICAgICAgICB0aGlzLnRhYmxlcy5sZWdhbEFpZFBhcnRuZXJzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdMZWdhbEFpZFBhcnRuZXJzJywge1xyXG4gICAgICAgICAgICB0YWJsZU5hbWU6ICdueWF5YS1taXRyYS1sZWdhbC1haWQtcGFydG5lcnMnLFxyXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BhcnRuZXJfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gIC8vIEltcG9ydGFudCBkYXRhXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50YWJsZXMubGVnYWxBaWRQYXJ0bmVycy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgICAgICAgIGluZGV4TmFtZTogJ3N0YXRlLWRpc3RyaWN0LWluZGV4JyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0ZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Rpc3RyaWN0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUQUJMRSAxMDogRXNjYWxhdGlvbiBMb2dzXHJcbiAgICAgICAgLy8gSElHSCByaXNrIGNhc2VzIGtlIGFsZXJ0c1xyXG4gICAgICAgIHRoaXMudGFibGVzLmVzY2FsYXRpb25Mb2dzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdFc2NhbGF0aW9uTG9ncycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtZXNjYWxhdGlvbi1sb2dzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdlc2NhbGF0aW9uX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudGFibGVzLmVzY2FsYXRpb25Mb2dzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgICAgICAgaW5kZXhOYW1lOiAndXNlci1pbmRleCcsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgMTE6IENhc2UgUmVmZXJyYWxzXHJcbiAgICAgICAgLy8gTGVnYWwgYWlkIHBhcnRuZXIga28gY2FzZSByZWZlciBrYXJuYVxyXG4gICAgICAgIHRoaXMudGFibGVzLmNhc2VSZWZlcnJhbHMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0Nhc2VSZWZlcnJhbHMnLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogJ255YXlhLW1pdHJhLWNhc2UtcmVmZXJyYWxzJyxcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyZWZlcnJhbF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVEFCTEUgMTI6IENvbXBsYWludCBBbmFseXRpY3NcclxuICAgICAgICAvLyBEYXNoYm9hcmQgbWVpbiBwb3B1bGFyIGlzc3VlcyBkaWtoYW5lIGtlIGxpeWVcclxuICAgICAgICB0aGlzLnRhYmxlcy5jb21wbGFpbnRBbmFseXRpY3MgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0NvbXBsYWludEFuYWx5dGljcycsIHtcclxuICAgICAgICAgICAgdGFibGVOYW1lOiAnbnlheWEtbWl0cmEtY29tcGxhaW50LWFuYWx5dGljcycsXHJcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RhdGVfZGlzdHJpY3QnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICd0aW1lc3RhbXAnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBTMyBCVUNLRVRTXHJcbiAgICAgICAgLy8g4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQXHJcblxyXG4gICAgICAgIC8vIEJVQ0tFVCAxOiBGcm9udGVuZFxyXG4gICAgICAgIC8vIFJlYWN0IGFwcCB5YWhhbiBkZXBsb3kgaG9naVxyXG4gICAgICAgIHRoaXMuYnVja2V0cy5mcm9udGVuZCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0Zyb250ZW5kJywge1xyXG4gICAgICAgICAgICBidWNrZXROYW1lOiBgbnlheWEtbWl0cmEtZnJvbnRlbmQtJHt0aGlzLmFjY291bnR9YCxcclxuICAgICAgICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXHJcbiAgICAgICAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXHJcbiAgICAgICAgICAgIHdlYnNpdGVFcnJvckRvY3VtZW50OiAnaW5kZXguaHRtbCcsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICAgICAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEJVQ0tFVCAyOiBMZWdhbCBDb3JwdXMgKEtlbmRyYSByZXBsYWNlKVxyXG4gICAgICAgIC8vIExlZ2FsIC50eHQgZG9jdW1lbnRzIHlhaGFuIHJha2hlIGpheWVuZ2VcclxuICAgICAgICB0aGlzLmJ1Y2tldHMubGVnYWxDb3JwdXMgPSBuZXcgczMuQnVja2V0KHRoaXMsICdMZWdhbENvcnB1cycsIHtcclxuICAgICAgICAgICAgYnVja2V0TmFtZTogYG55YXlhLW1pdHJhLWxlZ2FsLWNvcnB1cy0ke3RoaXMuYWNjb3VudH1gLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICB2ZXJzaW9uZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBCVUNLRVQgMzogVXNlciBEb2N1bWVudHMgKGdlbmVyYXRlZCBQREZzKVxyXG4gICAgICAgIC8vIENvbXBsYWludHMgYXVyIHRpbWVsaW5lcyBrZSBQREZzXHJcbiAgICAgICAgdGhpcy5idWNrZXRzLnVzZXJEb2N1bWVudHMgPSBuZXcgczMuQnVja2V0KHRoaXMsICdVc2VyRG9jdW1lbnRzJywge1xyXG4gICAgICAgICAgICBidWNrZXROYW1lOiBgbnlheWEtbWl0cmEtdXNlci1kb2N1bWVudHMtJHt0aGlzLmFjY291bnR9YCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5LTVMsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IHByb3BzLmttc0tleSxcclxuICAgICAgICAgICAgbGlmZWN5Y2xlUnVsZXM6IFt7XHJcbiAgICAgICAgICAgICAgICBpZDogJ0RlbGV0ZUFmdGVyMVllYXInLFxyXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDM2NSlcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICAgICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTExcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQlVDS0VUIDQ6IFVzZXIgVXBsb2FkcyAobm90aWNlIHVwbG9hZHMsIGV2aWRlbmNlKVxyXG4gICAgICAgIC8vIFVzZXJzIHlhaGFuIGFwbmUgZG9jdW1lbnRzIHVwbG9hZCBrYXJlbmdlXHJcbiAgICAgICAgdGhpcy5idWNrZXRzLnVzZXJVcGxvYWRzID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnVXNlclVwbG9hZHMnLCB7XHJcbiAgICAgICAgICAgIGJ1Y2tldE5hbWU6IGBueWF5YS1taXRyYS11c2VyLXVwbG9hZHMtJHt0aGlzLmFjY291bnR9YCxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5LTVMsXHJcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IHByb3BzLmttc0tleSxcclxuICAgICAgICAgICAgY29yczogW3tcclxuICAgICAgICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuUFVULCBzMy5IdHRwTWV0aG9kcy5QT1NULCBzMy5IdHRwTWV0aG9kcy5HRVRdLFxyXG4gICAgICAgICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnaHR0cDovL2xvY2FsaG9zdDo1MTczJywgJ2h0dHBzOi8vbnlheWFtaXRyYS5pbicsICcqJ10sXHJcbiAgICAgICAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2U6IDMwMDBcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbe1xyXG4gICAgICAgICAgICAgICAgaWQ6ICdEZWxldGVBZnRlcjkwRGF5cycsXHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoOTApXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEJVQ0tFVCA1OiBUZW1wbGF0ZXNcclxuICAgICAgICAvLyBDb21wbGFpbnQgdGVtcGxhdGVzIHN0b3JlXHJcbiAgICAgICAgdGhpcy5idWNrZXRzLnRlbXBsYXRlcyA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1RlbXBsYXRlcycsIHtcclxuICAgICAgICAgICAgYnVja2V0TmFtZTogYG55YXlhLW1pdHJhLXRlbXBsYXRlcy0ke3RoaXMuYWNjb3VudH1gLFxyXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogcHJvcHMua21zS2V5LFxyXG4gICAgICAgICAgICB2ZXJzaW9uZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgT3V0cHV0cyDilIDilIBcclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRnJvbnRlbmRCdWNrZXQnLCB7IHZhbHVlOiB0aGlzLmJ1Y2tldHMuZnJvbnRlbmQuYnVja2V0TmFtZSwgZXhwb3J0TmFtZTogJ055YXlhRnJvbnRlbmRCdWNrZXQnIH0pO1xyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMZWdhbENvcnB1c0J1Y2tldCcsIHsgdmFsdWU6IHRoaXMuYnVja2V0cy5sZWdhbENvcnB1cy5idWNrZXROYW1lLCBleHBvcnROYW1lOiAnTnlheWFMZWdhbENvcnB1c0J1Y2tldCcgfSk7XHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJEb2NzQnVja2V0JywgeyB2YWx1ZTogdGhpcy5idWNrZXRzLnVzZXJEb2N1bWVudHMuYnVja2V0TmFtZSwgZXhwb3J0TmFtZTogJ055YXlhVXNlckRvY3NCdWNrZXQnIH0pO1xyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyVXBsb2Fkc0J1Y2tldCcsIHsgdmFsdWU6IHRoaXMuYnVja2V0cy51c2VyVXBsb2Fkcy5idWNrZXROYW1lLCBleHBvcnROYW1lOiAnTnlheWFVc2VyVXBsb2Fkc0J1Y2tldCcgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19