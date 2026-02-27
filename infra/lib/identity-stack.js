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
exports.IdentityStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
class IdentityStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            removalPolicy: cdk.RemovalPolicy.RETAIN // Production data protect karo
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
                    'http://localhost:5173/callback', // Development
                    'https://nyayamitra.in/callback' // Production
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
exports.IdentityStack = IdentityStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpZGVudGl0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsaUVBQW1EO0FBUW5ELE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSXhDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDL0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDbkQsWUFBWSxFQUFFLG1CQUFtQjtZQUNqQyxpQkFBaUIsRUFBRSxJQUFJO1lBRXZCLDRCQUE0QjtZQUM1QixhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7WUFDM0MsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO1lBRXhDLHlEQUF5RDtZQUN6RCxnQkFBZ0IsRUFBRTtnQkFDZCxrQkFBa0IsRUFBRSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQ2xFLG1CQUFtQixFQUFFLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDbkUsc0JBQXNCLEVBQUUsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUN0RSxjQUFjLEVBQUUsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUM5RCxlQUFlLEVB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QUMvQixVQUFVLEVBQUUsaUJBQWlCO1NBQ2hDLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCO1lBQzNDLFVBQVUsRUFBRSx1QkFBdUI7U0FDdEMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDckMsS0FBSyxFQUFFLG9EQUFvRDtZQUMzRCxVQUFVLEVBQUUsb0JBQW9CO1NBQ25DLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXpHRCxzQ0F5R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcclxuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmludGVyZmFjZSBJZGVudGl0eVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgICBrbXNLZXk6IGttcy5LZXk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBJZGVudGl0eVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICAgIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcclxuICAgIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogSWRlbnRpdHlTdGFja1Byb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgICAgIC8vIOKUgOKUgCBDb2duaXRvIFVzZXIgUG9vbCDilIDilIBcclxuICAgICAgICB0aGlzLnVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1VzZXJQb29sJywge1xyXG4gICAgICAgICAgICB1c2VyUG9vbE5hbWU6ICdueWF5YS1taXRyYS11c2VycycsXHJcbiAgICAgICAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxyXG5cclxuICAgICAgICAgICAgLy8gRW1haWwgeWEgcGhvbmUgc2Ugc2lnbiBpblxyXG4gICAgICAgICAgICBzaWduSW5BbGlhc2VzOiB7IGVtYWlsOiB0cnVlLCBwaG9uZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICBhdXRvVmVyaWZ5OiB7IGVtYWlsOiB0cnVlLCBwaG9uZTogdHJ1ZSB9LFxyXG5cclxuICAgICAgICAgICAgLy8gQ3VzdG9tIGF0dHJpYnV0ZXMg4oCUIHllIGJhYWQgbWVpbiBMYW1iZGEgbWVpbiB1c2UgaG9uZ2VcclxuICAgICAgICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xyXG4gICAgICAgICAgICAgICAgcHJlZmVycmVkX2xhbmd1YWdlOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoeyBtdXRhYmxlOiB0cnVlIH0pLFxyXG4gICAgICAgICAgICAgICAgdXNlcl9sb2NhdGlvbl9zdGF0ZTogbmV3IGNvZ25pdG8uU3RyaW5nQXR0cmlidXRlKHsgbXV0YWJsZTogdHJ1ZSB9KSxcclxuICAgICAgICAgICAgICAgIHVzZXJfbG9jYXRpb25fZGlzdHJpY3Q6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7IG11dGFibGU6IHRydWUgfSksXHJcbiAgICAgICAgICAgICAgICBhbm9ueW1vdXNfbW9kZTogbmV3IGNvZ25pdG8uU3RyaW5nQXR0cmlidXRlKHsgbXV0YWJsZTogdHJ1ZSB9KSxcclxuICAgICAgICAgICAgICAgIGxhc3Rfcmlza19zY29yZTogbmV3IGNvZ25pdG8uTnVtYmVyQXR0cmlidXRlKHsgbXV0YWJsZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcclxuICAgICAgICAgICAgICAgIG1pbkxlbmd0aDogOCxcclxuICAgICAgICAgICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLy8gT3B0aW9uYWwgTUZBXHJcbiAgICAgICAgICAgIG1mYTogY29nbml0by5NZmEuT1BUSU9OQUwsXHJcbiAgICAgICAgICAgIG1mYVNlY29uZEZhY3RvcjogeyBzbXM6IHRydWUsIG90cDogZmFsc2UgfSxcclxuXHJcbiAgICAgICAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuRU1BSUxfQU5EX1BIT05FX1dJVEhPVVRfTUZBLFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gIC8vIFByb2R1Y3Rpb24gZGF0YSBwcm90ZWN0IGthcm9cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIFVzZXIgR3JvdXBzIOKUgOKUgFxyXG4gICAgICAgIGNvbnN0IGdyb3VwcyA9IFtcclxuICAgICAgICAgICAgeyBuYW1lOiAnYWRtaW4nLCBkZXNjOiAnU3lzdGVtIGFkbWluaXN0cmF0b3JzJyB9LFxyXG4gICAgICAgICAgICB7IG5hbWU6ICdsZWdhbF9haWRfcGFydG5lcicsIGRlc2M6ICdMZWdhbCBhaWQgb3JnYW5pemF0aW9ucycgfSxcclxuICAgICAgICAgICAgeyBuYW1lOiAncmVnaXN0ZXJlZCcsIGRlc2M6ICdSZWdpc3RlcmVkIHVzZXJzJyB9XHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZ3JvdXBzLmZvckVhY2goZyA9PiB7XHJcbiAgICAgICAgICAgIG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAodGhpcywgYCR7Zy5uYW1lfUdyb3VwYCwge1xyXG4gICAgICAgICAgICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lOiBnLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZy5kZXNjXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgQXBwIENsaWVudCAoV2ViIEZyb250ZW5kIGtlIGxpeWUpIOKUgOKUgFxyXG4gICAgICAgIHRoaXMudXNlclBvb2xDbGllbnQgPSB0aGlzLnVzZXJQb29sLmFkZENsaWVudCgnV2ViQ2xpZW50Jywge1xyXG4gICAgICAgICAgICB1c2VyUG9vbENsaWVudE5hbWU6ICdueWF5YS1taXRyYS13ZWInLFxyXG4gICAgICAgICAgICBhdXRoRmxvd3M6IHtcclxuICAgICAgICAgICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHVzZXJTcnA6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBjdXN0b206IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb0F1dGg6IHtcclxuICAgICAgICAgICAgICAgIGZsb3dzOiB7IGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IHRydWUgfSxcclxuICAgICAgICAgICAgICAgIHNjb3BlczogW1xyXG4gICAgICAgICAgICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5FTUFJTCxcclxuICAgICAgICAgICAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklELFxyXG4gICAgICAgICAgICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5QUk9GSUxFXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tVcmxzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6NTE3My9jYWxsYmFjaycsICAgIC8vIERldmVsb3BtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vbnlheWFtaXRyYS5pbi9jYWxsYmFjaycgICAgIC8vIFByb2R1Y3Rpb25cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBsb2dvdXRVcmxzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6NTE3My8nLFxyXG4gICAgICAgICAgICAgICAgICAgICdodHRwczovL255YXlhbWl0cmEuaW4vJ1xyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhY2Nlc3NUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXHJcbiAgICAgICAgICAgIGlkVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxyXG4gICAgICAgICAgICByZWZyZXNoVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxyXG4gICAgICAgICAgICBwcmV2ZW50VXNlckV4aXN0ZW5jZUVycm9yczogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgSG9zdGVkIFVJIERvbWFpbiDilIDilIBcclxuICAgICAgICB0aGlzLnVzZXJQb29sLmFkZERvbWFpbignQ29nbml0b0RvbWFpbicsIHtcclxuICAgICAgICAgICAgY29nbml0b0RvbWFpbjogeyBkb21haW5QcmVmaXg6ICdueWF5YS1taXRyYS1hdXRoJyB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIOKUgOKUgCBPdXRwdXRzIOKAlCBNZW1iZXIgNCBrbyBjaGFoaXllIGZyb250ZW5kIGtlIGxpeWUg4pSA4pSAXHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YVVzZXJQb29sSWQnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sQ2xpZW50SWQnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YVVzZXJQb29sQ2xpZW50SWQnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NvZ25pdG9Eb21haW4nLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiAnbnlheWEtbWl0cmEtYXV0aC5hdXRoLmFwLXNvdXRoLTEuYW1hem9uY29nbml0by5jb20nLFxyXG4gICAgICAgICAgICBleHBvcnROYW1lOiAnTnlheWFDb2duaXRvRG9tYWluJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==