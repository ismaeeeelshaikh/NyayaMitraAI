import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DataStackProps extends cdk.StackProps {
    kmsKey: kms.Key;
}

export class DataStack extends cdk.Stack {
    public readonly tables: { [key: string]: dynamodb.Table } = {};
    public readonly buckets: { [key: string]: s3.Bucket } = {};

    constructor(scope: Construct, id: string, props: DataStackProps) {
        super(scope, id, props);

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
            removalPolicy: cdk.RemovalPolicy.RETAIN  // User data kabhi delete nahi
        });

        // TABLE 2: Sessions
        // Har conversation ka session — TTL se auto-delete
        this.tables.sessions = new dynamodb.Table(this, 'Sessions', {
            tableName: 'nyaya-mitra-sessions',
            partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.kmsKey,
            timeToLiveAttribute: 'ttl',  // Guest: 24h, Registered: 7 days
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
            timeToLiveAttribute: 'ttl',  // Guest: 24h, Registered: 90 days
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // TABLE 4: Connections (WebSocket)
        // Active WebSocket connections track karta hai
        this.tables.connections = new dynamodb.Table(this, 'Connections', {
            tableName: 'nyaya-mitra-connections',
            partitionKey: { name: 'connection_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: 'ttl',  // 2 hours
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
            removalPolicy: cdk.RemovalPolicy.RETAIN  // Important data
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
