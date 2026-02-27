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
exports.OpsStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
class OpsStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ── CloudWatch Dashboard ──
        const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: 'NyayaMitraOperations'
        });
        dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'API Gateway — Requests (5 min)',
            left: [new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Count',
                    dimensionsMap: { ApiId: props.httpApi.apiId },
                    period: cdk.Duration.minutes(5)
                })],
            width: 12, height: 6
        }), new cloudwatch.GraphWidget({
            title: 'API Gateway — Latency p95',
            left: [new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Latency',
                    dimensionsMap: { ApiId: props.httpApi.apiId },
                    statistic: 'p95',
                    period: cdk.Duration.minutes(5)
                })],
            width: 12, height: 6
        }), new cloudwatch.GraphWidget({
            title: 'Lambda Errors (all functions)',
            left: [new cloudwatch.Metric({
                    namespace: 'AWS/Lambda',
                    metricName: 'Errors',
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5)
                })],
            width: 12, height: 6
        }), new cloudwatch.GraphWidget({
            title: 'DynamoDB — Consumed Write Units',
            left: [new cloudwatch.Metric({
                    namespace: 'AWS/DynamoDB',
                    metricName: 'ConsumedWriteCapacityUnits',
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5)
                })],
            width: 12, height: 6
        }));
        // ── Alarm: Lambda Error Rate ──
        new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
            alarmName: 'nyaya-mitra-lambda-errors',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                statistic: 'Sum',
                period: cdk.Duration.minutes(5)
            }),
            threshold: 10,
            evaluationPeriods: 2,
            alarmDescription: 'Lambda error rate too high — check logs'
        });
        // ── EventBridge: Daily notice deadline check ──
        // Member 3 ka deadline-reminder Lambda yahan wire hoga (integration mein)
        new events.Rule(this, 'DailyNoticeCheck', {
            ruleName: 'nyaya-daily-notice-deadline-check',
            description: 'Daily 8 AM IST — check expiring notice deadlines',
            schedule: events.Schedule.cron({
                hour: '2', // 2 AM UTC = 7:30 AM IST
                minute: '30'
            })
        });
        // ── EventBridge: Daily complaint follow-up ──
        new events.Rule(this, 'DailyFollowUp', {
            ruleName: 'nyaya-daily-complaint-followup',
            description: 'Daily 9 AM IST — complaint follow-up reminders',
            schedule: events.Schedule.cron({
                hour: '3', // 3 AM UTC = 8:30 AM IST
                minute: '30'
            })
        });
    }
}
exports.OpsStack = OpsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib3BzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBUWpELE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ25DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNkJBQTZCO1FBQzdCLE1BQU0sU0FBUyxHQUFHLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQzFELGFBQWEsRUFBRSxzQkFBc0I7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsU0FBUyxDQUFDLFVBQVUsQ0FDaEIsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3ZCLEtBQUssRUFBRSxnQ0FBZ0M7WUFDdkMsSUFBSSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUN6QixTQUFTLEVBQUUsZ0JBQWdCO29CQUMzQixVQUFVLEVBQUUsT0FBTztvQkFDbkIsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO29CQUM3QyxNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNsQyxDQUFDLENBQUM7WUFDSCxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO1NBQ3ZCLENBQUMsRUFDRixJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUM7WUFDdkIsS0FBSyxFQUFFLDJCQUEyQjtZQUNsQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7b0JBQ3pCLFNBQVMsRUFBRSxnQkFBZ0I7b0JBQzNCLFVBQVUsRUFBRSxTQUFTO29CQUNyQixhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7b0JBQzdDLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNsQyxDQUFDLENBQUM7WUFDSCxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO1NBQ3ZCLENBQUMsRUFDRixJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUM7WUFDdkIsS0FBSyxFQUFFLCtCQUErQjtZQUN0QyxJQUFJLEVBQUUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7b0JBQ3pCLFNBQVMsRUFBRSxZQUFZO29CQUN2QixVQUFVLEVBQUUsUUFBUTtvQkFDcEIsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQ2xDLENBQUMsQ0FBQztZQUNILEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUM7U0FDdkIsQ0FBQyxFQUNGLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUN2QixLQUFLLEVBQUUsaUNBQWlDO1lBQ3hDLElBQUksRUFBRSxDQUFDLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDekIsU0FBUyxFQUFFLGNBQWM7b0JBQ3pCLFVBQVUsRUFBRSw0QkFBNEI7b0JBQ3hDLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNsQyxDQUFDLENBQUM7WUFDSCxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO1NBQ3ZCLENBQUMsQ0FDTCxDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDM0MsU0FBUyxFQUFFLDJCQUEyQjtZQUN0QyxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUMxQixTQUFTLEVBQUUsWUFBWTtnQkFDdkIsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ2xDLENBQUM7WUFDRixTQUFTLEVBQUUsRUFBRTtZQUNiLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsZ0JBQWdCLEVBQUUseUNBQXlDO1NBQzlELENBQUMsQ0FBQztRQUVILGlEQUFpRDtRQUNqRCwwRUFBMEU7UUFDMUUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0QyxRQUFRLEVBQUUsbUNBQW1DO1lBQzdDLFdBQVcsRUFBRSxrREFBa0Q7WUFDL0QsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUMzQixJQUFJLEVBQUUsR0FBRyxFQUFLLHlCQUF5QjtnQkFDdkMsTUFBTSxFQUFFLElBQUk7YUFDZixDQUFDO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsK0NBQStDO1FBQy9DLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ25DLFFBQVEsRUFBRSxnQ0FBZ0M7WUFDMUMsV0FBVyxFQUFFLGdEQUFnRDtZQUM3RCxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQzNCLElBQUksRUFBRSxHQUFHLEVBQUsseUJBQXlCO2dCQUN2QyxNQUFNLEVBQUUsSUFBSTthQUNmLENBQUM7U0FDTCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUF4RkQsNEJBd0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XHJcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheXYyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djInO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmludGVyZmFjZSBPcHNTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xyXG4gICAgaHR0cEFwaTogYXBpZ2F0ZXdheXYyLkh0dHBBcGk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBPcHNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT3BzU3RhY2tQcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgQ2xvdWRXYXRjaCBEYXNoYm9hcmQg4pSA4pSAXHJcbiAgICAgICAgY29uc3QgZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdEYXNoYm9hcmQnLCB7XHJcbiAgICAgICAgICAgIGRhc2hib2FyZE5hbWU6ICdOeWF5YU1pdHJhT3BlcmF0aW9ucydcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZGFzaGJvYXJkLmFkZFdpZGdldHMoXHJcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkg4oCUIFJlcXVlc3RzICg1IG1pbiknLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogW25ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDb3VudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlJZDogcHJvcHMuaHR0cEFwaS5hcGlJZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSlcclxuICAgICAgICAgICAgICAgIH0pXSxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAxMiwgaGVpZ2h0OiA2XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IOKAlCBMYXRlbmN5IHA5NScsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBbbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0xhdGVuY3knLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpSWQ6IHByb3BzLmh0dHBBcGkuYXBpSWQgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdwOTUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSlcclxuICAgICAgICAgICAgICAgIH0pXSxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAxMiwgaGVpZ2h0OiA2XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0xhbWJkYSBFcnJvcnMgKGFsbCBmdW5jdGlvbnMpJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6IFtuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9MYW1iZGEnLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdFcnJvcnMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KVxyXG4gICAgICAgICAgICAgICAgfSldLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEyLCBoZWlnaHQ6IDZcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnRHluYW1vREIg4oCUIENvbnN1bWVkIFdyaXRlIFVuaXRzJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6IFtuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9EeW5hbW9EQicsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NvbnN1bWVkV3JpdGVDYXBhY2l0eVVuaXRzJyxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSlcclxuICAgICAgICAgICAgICAgIH0pXSxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAxMiwgaGVpZ2h0OiA2XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIEFsYXJtOiBMYW1iZGEgRXJyb3IgUmF0ZSDilIDilIBcclxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnTGFtYmRhRXJyb3JBbGFybScsIHtcclxuICAgICAgICAgICAgYWxhcm1OYW1lOiAnbnlheWEtbWl0cmEtbGFtYmRhLWVycm9ycycsXHJcbiAgICAgICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9MYW1iZGEnLFxyXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0Vycm9ycycsXHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgdGhyZXNob2xkOiAxMCxcclxuICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXHJcbiAgICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZXJyb3IgcmF0ZSB0b28gaGlnaCDigJQgY2hlY2sgbG9ncydcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIEV2ZW50QnJpZGdlOiBEYWlseSBub3RpY2UgZGVhZGxpbmUgY2hlY2sg4pSA4pSAXHJcbiAgICAgICAgLy8gTWVtYmVyIDMga2EgZGVhZGxpbmUtcmVtaW5kZXIgTGFtYmRhIHlhaGFuIHdpcmUgaG9nYSAoaW50ZWdyYXRpb24gbWVpbilcclxuICAgICAgICBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ0RhaWx5Tm90aWNlQ2hlY2snLCB7XHJcbiAgICAgICAgICAgIHJ1bGVOYW1lOiAnbnlheWEtZGFpbHktbm90aWNlLWRlYWRsaW5lLWNoZWNrJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEYWlseSA4IEFNIElTVCDigJQgY2hlY2sgZXhwaXJpbmcgbm90aWNlIGRlYWRsaW5lcycsXHJcbiAgICAgICAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUuY3Jvbih7XHJcbiAgICAgICAgICAgICAgICBob3VyOiAnMicsICAgIC8vIDIgQU0gVVRDID0gNzozMCBBTSBJU1RcclxuICAgICAgICAgICAgICAgIG1pbnV0ZTogJzMwJ1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgRXZlbnRCcmlkZ2U6IERhaWx5IGNvbXBsYWludCBmb2xsb3ctdXAg4pSA4pSAXHJcbiAgICAgICAgbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdEYWlseUZvbGxvd1VwJywge1xyXG4gICAgICAgICAgICBydWxlTmFtZTogJ255YXlhLWRhaWx5LWNvbXBsYWludC1mb2xsb3d1cCcsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGFpbHkgOSBBTSBJU1Qg4oCUIGNvbXBsYWludCBmb2xsb3ctdXAgcmVtaW5kZXJzJyxcclxuICAgICAgICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5jcm9uKHtcclxuICAgICAgICAgICAgICAgIGhvdXI6ICczJywgICAgLy8gMyBBTSBVVEMgPSA4OjMwIEFNIElTVFxyXG4gICAgICAgICAgICAgICAgbWludXRlOiAnMzAnXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19