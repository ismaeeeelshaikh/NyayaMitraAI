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
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
class ApiStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyRUFBNkQ7QUFTN0QsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJbkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNyRCxPQUFPLEVBQUUsaUJBQWlCO1lBQzFCLFdBQVcsRUFBRSxzQkFBc0I7WUFDbkMsYUFBYSxFQUFFO2dCQUNYLFlBQVksRUFBRTtvQkFDVix1QkFBdUI7b0JBQ3ZCLHVCQUF1QjtvQkFDdkIsdUJBQXVCO2lCQUMxQjtnQkFDRCxZQUFZLEVBQUU7b0JBQ1YsWUFBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHO29CQUMvQixZQUFZLENBQUMsY0FBYyxDQUFDLElBQUk7b0JBQ2hDLFlBQVksQ0FBQyxjQUFjLENBQUMsT0FBTztvQkFDbkMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHO2lCQUNsQztnQkFDRCxZQUFZLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGNBQWMsQ0FBQztnQkFDL0QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUMvQjtZQUNELHFEQUFxRDtZQUNyRCx1Q0FBdUM7U0FDMUMsQ0FBQyxDQUFDO1FBRUgsdUJBQXVCO1FBQ3ZCLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQzFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztZQUNyQixTQUFTLEVBQUUsTUFBTTtZQUNqQixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7UUFFSCx1Q0FBdUM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNqRSxPQUFPLEVBQUUscUJBQXFCO1lBQzlCLFdBQVcsRUFBRSwwQ0FBMEM7WUFDdkQsd0JBQXdCLEVBQUUsc0JBQXNCO1NBQ25ELENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QixNQUFNLE9BQU8sR0FBRyxJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUM3RCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsU0FBUyxFQUFFLE1BQU07WUFDakIsVUFBVSxFQUFFLElBQUk7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsZ0JBQWdCO1FBQ2hCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2xDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDL0IsVUFBVSxFQUFFLGlCQUFpQjtTQUNoQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNqQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLO1lBQ3pCLFVBQVUsRUFBRSxnQkFBZ0I7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDcEMsS0FBSyxFQUFFLFNBQVMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLDRDQUE0QztZQUNuRixVQUFVLEVBQUUsbUJBQW1CO1NBQ2xDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDdEMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSztZQUM5QixVQUFVLEVBQUUscUJBQXFCO1NBQ3BDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXhFRCw0QkF3RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5djIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXl2Mic7XHJcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmludGVyZmFjZSBBcGlTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xyXG4gICAgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XHJcbiAgICB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFwaVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBodHRwQXBpOiBhcGlnYXRld2F5djIuSHR0cEFwaTtcclxuICAgIHB1YmxpYyByZWFkb25seSB3ZWJTb2NrZXRBcGk6IGFwaWdhdGV3YXl2Mi5XZWJTb2NrZXRBcGk7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFwaVN0YWNrUHJvcHMpIHtcclxuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIEhUVFAgUkVTVCBBUEkg4pSA4pSAXHJcbiAgICAgICAgdGhpcy5odHRwQXBpID0gbmV3IGFwaWdhdGV3YXl2Mi5IdHRwQXBpKHRoaXMsICdIdHRwQXBpJywge1xyXG4gICAgICAgICAgICBhcGlOYW1lOiAnbnlheWEtbWl0cmEtYXBpJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOeWF5YSBNaXRyYSBSRVNUIEFQSScsXHJcbiAgICAgICAgICAgIGNvcnNQcmVmbGlnaHQ6IHtcclxuICAgICAgICAgICAgICAgIGFsbG93T3JpZ2luczogW1xyXG4gICAgICAgICAgICAgICAgICAgICdodHRwOi8vbG9jYWxob3N0OjUxNzMnLFxyXG4gICAgICAgICAgICAgICAgICAgICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxyXG4gICAgICAgICAgICAgICAgICAgICdodHRwczovL255YXlhbWl0cmEuaW4nXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgYWxsb3dNZXRob2RzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgYXBpZ2F0ZXdheXYyLkNvcnNIdHRwTWV0aG9kLkdFVCxcclxuICAgICAgICAgICAgICAgICAgICBhcGlnYXRld2F5djIuQ29yc0h0dHBNZXRob2QuUE9TVCxcclxuICAgICAgICAgICAgICAgICAgICBhcGlnYXRld2F5djIuQ29yc0h0dHBNZXRob2QuT1BUSU9OUyxcclxuICAgICAgICAgICAgICAgICAgICBhcGlnYXRld2F5djIuQ29yc0h0dHBNZXRob2QuUFVUXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ1gtU2Vzc2lvbi1JZCddLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlOiBjZGsuRHVyYXRpb24uZGF5cygxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE5PVEU6IEF1dGggYXV0aG9yaXplciBJbnRlZ3JhdGlvbiBtZWluIGFkZCBrYXJlbmdlXHJcbiAgICAgICAgICAgIC8vIGt5dW5raSBMYW1iZGEgQVJOcyBiYWFkIG1laW4gbWlsZW5nZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgSFRUUCBBUEkgU3RhZ2Ug4pSA4pSAXHJcbiAgICAgICAgbmV3IGFwaWdhdGV3YXl2Mi5IdHRwU3RhZ2UodGhpcywgJ0h0dHBTdGFnZScsIHtcclxuICAgICAgICAgICAgaHR0cEFwaTogdGhpcy5odHRwQXBpLFxyXG4gICAgICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcclxuICAgICAgICAgICAgYXV0b0RlcGxveTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgV2ViU29ja2V0IEFQSSAoUmVhbC10aW1lIENoYXQpIOKUgOKUgFxyXG4gICAgICAgIHRoaXMud2ViU29ja2V0QXBpID0gbmV3IGFwaWdhdGV3YXl2Mi5XZWJTb2NrZXRBcGkodGhpcywgJ0NoYXRXc0FwaScsIHtcclxuICAgICAgICAgICAgYXBpTmFtZTogJ255YXlhLW1pdHJhLWNoYXQtd3MnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ055YXlhIE1pdHJhIFdlYlNvY2tldCBmb3IgcmVhbC10aW1lIGNoYXQnLFxyXG4gICAgICAgICAgICByb3V0ZVNlbGVjdGlvbkV4cHJlc3Npb246ICckcmVxdWVzdC5ib2R5LmFjdGlvbidcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIFdlYlNvY2tldCBTdGFnZSDilIDilIBcclxuICAgICAgICBjb25zdCB3c1N0YWdlID0gbmV3IGFwaWdhdGV3YXl2Mi5XZWJTb2NrZXRTdGFnZSh0aGlzLCAnV3NTdGFnZScsIHtcclxuICAgICAgICAgICAgd2ViU29ja2V0QXBpOiB0aGlzLndlYlNvY2tldEFwaSxcclxuICAgICAgICAgICAgc3RhZ2VOYW1lOiAncHJvZCcsXHJcbiAgICAgICAgICAgIGF1dG9EZXBsb3k6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIE91dHB1dHMg4pSA4pSAXHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0h0dHBBcGlVcmwnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmh0dHBBcGkuYXBpRW5kcG9pbnQsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YUh0dHBBcGlVcmwnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdIdHRwQXBpSWQnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmh0dHBBcGkuYXBpSWQsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YUh0dHBBcGlJZCdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYlNvY2tldFVybCcsIHtcclxuICAgICAgICAgICAgdmFsdWU6IGB3c3M6Ly8ke3RoaXMud2ViU29ja2V0QXBpLmFwaUlkfS5leGVjdXRlLWFwaS5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vcHJvZGAsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YVdlYlNvY2tldFVybCdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYlNvY2tldEFwaUlkJywge1xyXG4gICAgICAgICAgICB2YWx1ZTogdGhpcy53ZWJTb2NrZXRBcGkuYXBpSWQsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6ICdOeWF5YVdlYlNvY2tldEFwaUlkJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==