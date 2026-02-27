import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
}

export class ApiStack extends cdk.Stack {
    public readonly httpApi: apigatewayv2.HttpApi;
    public readonly webSocketApi: apigatewayv2.WebSocketApi;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        // ── HTTP REST API ──
        this.httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
            apiName: 'nyaya-mitra-api',
            description: 'Nyaya Mitra REST API',
            corsPreflight: {
                allowOrigins: [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    'https://nyayamitra.in'
                ],
                allowMethods: [
                    apigatewayv2.CorsHttpMethod.GET,
                    apigatewayv2.CorsHttpMethod.POST,
                    apigatewayv2.CorsHttpMethod.OPTIONS,
                    apigatewayv2.CorsHttpMethod.PUT
                ],
                allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
                maxAge: cdk.Duration.days(1)
            }
            // NOTE: Auth authorizer Integration mein add karenge
            // kyunki Lambda ARNs baad mein milenge
        });

        // ── HTTP API Stage ──
        new apigatewayv2.HttpStage(this, 'HttpStage', {
            httpApi: this.httpApi,
            stageName: 'prod',
            autoDeploy: true
        });

        // ── WebSocket API (Real-time Chat) ──
        this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'ChatWsApi', {
            apiName: 'nyaya-mitra-chat-ws',
            description: 'Nyaya Mitra WebSocket for real-time chat',
            routeSelectionExpression: '$request.body.action'
        });

        // ── WebSocket Stage ──
        const wsStage = new apigatewayv2.WebSocketStage(this, 'WsStage', {
            webSocketApi: this.webSocketApi,
            stageName: 'prod',
            autoDeploy: true
        });

        // ── Outputs ──
        new cdk.CfnOutput(this, 'HttpApiUrl', {
            value: this.httpApi.apiEndpoint,
            exportName: 'NyayaHttpApiUrl'
        });

        new cdk.CfnOutput(this, 'HttpApiId', {
            value: this.httpApi.apiId,
            exportName: 'NyayaHttpApiId'
        });

        new cdk.CfnOutput(this, 'WebSocketUrl', {
            value: `wss://${this.webSocketApi.apiId}.execute-api.ap-south-1.amazonaws.com/prod`,
            exportName: 'NyayaWebSocketUrl'
        });

        new cdk.CfnOutput(this, 'WebSocketApiId', {
            value: this.webSocketApi.apiId,
            exportName: 'NyayaWebSocketApiId'
        });
    }
}
