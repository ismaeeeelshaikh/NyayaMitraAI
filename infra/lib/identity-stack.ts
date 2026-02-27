import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface IdentityStackProps extends cdk.StackProps {
    kmsKey: kms.Key;
}

export class IdentityStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props: IdentityStackProps) {
        super(scope, id, props);

        // ── Cognito User Pool ──
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'nyaya-mitra-users',
            selfSignUpEnabled: true,

            // Email ya phone se sign in
            signInAliases: { email: true, phone: true },
            autoVerify: { email: true, phone: true },

            // Custom attributes — ye baad mein Lambda mein use honge
            customAttributes: {
                preferred_language: new cognito.StringAttribute({ mutable: true }),
                user_location_state: new cognito.StringAttribute({ mutable: true }),
                user_location_district: new cognito.StringAttribute({ mutable: true }),
                anonymous_mode: new cognito.StringAttribute({ mutable: true }),
                last_risk_score: new cognito.NumberAttribute({ mutable: true })
            },

            passwordPolicy: {
                minLength: 8,
                requireDigits: true,
                requireSymbols: true,
                requireUppercase: false,
                requireLowercase: true
            },

            // Optional MFA
            mfa: cognito.Mfa.OPTIONAL,
            mfaSecondFactor: { sms: true, otp: false },

            accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
            removalPolicy: cdk.RemovalPolicy.RETAIN  // Production data protect karo
        });

        // ── User Groups ──
        const groups = [
            { name: 'admin', desc: 'System administrators' },
            { name: 'legal_aid_partner', desc: 'Legal aid organizations' },
            { name: 'registered', desc: 'Registered users' }
        ];

        groups.forEach(g => {
            new cognito.CfnUserPoolGroup(this, `${g.name}Group`, {
                userPoolId: this.userPool.userPoolId,
                groupName: g.name,
                description: g.desc
            });
        });

        // ── App Client (Web Frontend ke liye) ──
        this.userPoolClient = this.userPool.addClient('WebClient', {
            userPoolClientName: 'nyaya-mitra-web',
            authFlows: {
                userPassword: true,
                userSrp: true,
                custom: true
            },
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE
                ],
                callbackUrls: [
                    'http://localhost:5173/callback',    // Development
                    'https://nyayamitra.in/callback'     // Production
                ],
                logoutUrls: [
                    'http://localhost:5173/',
                    'https://nyayamitra.in/'
                ]
            },
            accessTokenValidity: cdk.Duration.hours(1),
            idTokenValidity: cdk.Duration.hours(1),
            refreshTokenValidity: cdk.Duration.days(30),
            preventUserExistenceErrors: true
        });

        // ── Hosted UI Domain ──
        this.userPool.addDomain('CognitoDomain', {
            cognitoDomain: { domainPrefix: 'nyaya-mitra-auth' }
        });

        // ── Outputs — Member 4 ko chahiye frontend ke liye ──
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            exportName: 'NyayaUserPoolId'
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            exportName: 'NyayaUserPoolClientId'
        });
        new cdk.CfnOutput(this, 'CognitoDomain', {
            value: 'nyaya-mitra-auth.auth.ap-south-1.amazoncognito.com',
            exportName: 'NyayaCognitoDomain'
        });
    }
}
