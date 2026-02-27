import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

interface OpsStackProps extends cdk.StackProps {
    httpApi: apigatewayv2.HttpApi;
}

export class OpsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: OpsStackProps) {
        super(scope, id, props);

        // ── CloudWatch Dashboard ──
        const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: 'NyayaMitraOperations'
        });

        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'API Gateway — Requests (5 min)',
                left: [new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Count',
                    dimensionsMap: { ApiId: props.httpApi.apiId },
                    period: cdk.Duration.minutes(5)
                })],
                width: 12, height: 6
            }),
            new cloudwatch.GraphWidget({
                title: 'API Gateway — Latency p95',
                left: [new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Latency',
                    dimensionsMap: { ApiId: props.httpApi.apiId },
                    statistic: 'p95',
                    period: cdk.Duration.minutes(5)
                })],
                width: 12, height: 6
            }),
            new cloudwatch.GraphWidget({
                title: 'Lambda Errors (all functions)',
                left: [new cloudwatch.Metric({
                    namespace: 'AWS/Lambda',
                    metricName: 'Errors',
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5)
                })],
                width: 12, height: 6
            }),
            new cloudwatch.GraphWidget({
                title: 'DynamoDB — Consumed Write Units',
                left: [new cloudwatch.Metric({
                    namespace: 'AWS/DynamoDB',
                    metricName: 'ConsumedWriteCapacityUnits',
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5)
                })],
                width: 12, height: 6
            })
        );

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
                hour: '2',    // 2 AM UTC = 7:30 AM IST
                minute: '30'
            })
        });

        // ── EventBridge: Daily complaint follow-up ──
        new events.Rule(this, 'DailyFollowUp', {
            ruleName: 'nyaya-daily-complaint-followup',
            description: 'Daily 9 AM IST — complaint follow-up reminders',
            schedule: events.Schedule.cron({
                hour: '3',    // 3 AM UTC = 8:30 AM IST
                minute: '30'
            })
        });
    }
}
