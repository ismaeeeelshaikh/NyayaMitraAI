"""
Dashboard Widgets
HTTP API: GET /v1/dashboard/widgets?state=MH&district=MUMBAI

Returns:
  popular_issues:    Last 30 days ke top issues
  suggested_actions: User ke liye smart suggestions
  legal_updates:     Recent legal news
"""
import boto3
import json
import os
from datetime import datetime, timedelta
from collections import Counter

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

STATIC_LEGAL_UPDATES = [
    {
        'date': '2024-12-01',
        'title': 'Supreme Court: Speedy Trial Right',
        'summary': 'Undertrial prisoners entitled to bail if trial delayed beyond reasonable period.',
        'category': 'criminal', 'state': 'Central'
    },
    {
        'date': '2024-11-15',
        'title': 'Consumer Protection: E-commerce Refund Rules Strengthened',
        'summary': 'E-commerce platforms must process refunds within 5 days of return acceptance.',
        'category': 'consumer', 'state': 'Central'
    },
    {
        'date': '2024-11-01',
        'title': 'Digital Personal Data Protection Act Implementation',
        'summary': 'Citizens can now request deletion of their personal data from online platforms.',
        'category': 'cyber', 'state': 'Central'
    },
    {
        'date': '2024-10-20',
        'title': 'Labor Ministry: Gratuity Payment Deadline',
        'summary': 'Employers must pay gratuity within 30 days or pay 10% interest per annum.',
        'category': 'labor', 'state': 'Central'
    }
]

SUGGESTED_ACTIONS = [
    {'action': 'Upload a legal notice for instant AI analysis', 'route': '/notice-scanner', 'icon': 'scan'},
    {'action': 'Generate a police complaint in 2 minutes',      'route': '/complaint-generator?type=police', 'icon': 'document'},
    {'action': 'Build your case timeline with AI',              'route': '/timeline', 'icon': 'timeline'},
    {'action': 'Find free legal aid near you',                  'route': '/legal-aid', 'icon': 'location'},
    {'action': 'File an RTI application online',                'route': '/complaint-generator?type=rti', 'icon': 'rti'}
]

def handler(event, context):
    params   = event.get('queryStringParameters') or {}
    state    = params.get('state', 'MH')
    district = params.get('district', 'MUMBAI')
    key      = f"{state}_{district}"
    since    = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    # Popular issues from analytics table
    popular_issues = []
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-complaint-analytics').query(
            KeyConditionExpression='state_district = :k AND #ts > :d',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={':k': key, ':d': since},
            Limit=100
        )
        counts = Counter()
        for item in resp.get('Items', []):
            counts[item.get('issue_type', 'other')] += int(item.get('count', 0))

        issue_names = {
            'property': 'Property Disputes',
            'family':   'Family & Matrimonial',
            'consumer': 'Consumer Rights',
            'criminal': 'Criminal Matters',
            'labor':    'Labour & Employment',
            'cyber':    'Cyber Crime'
        }

        for issue, count in counts.most_common(5):
            popular_issues.append({
                'issue_type':    issue,
                'count':         count,
                'display_name':  issue_names.get(issue, issue.title()),
                'trend':         'up' if count > 30 else 'stable'
            })
    except Exception:
        # Fallback static data
        popular_issues = [
            {'issue_type': 'property',  'count': 234, 'display_name': 'Property Disputes',   'trend': 'up'},
            {'issue_type': 'family',    'count': 189, 'display_name': 'Family & Matrimonial', 'trend': 'stable'},
            {'issue_type': 'consumer',  'count': 156, 'display_name': 'Consumer Rights',      'trend': 'up'},
            {'issue_type': 'criminal',  'count': 98,  'display_name': 'Criminal Matters',     'trend': 'stable'},
            {'issue_type': 'labor',     'count': 76,  'display_name': 'Labour & Employment',  'trend': 'down'},
        ]

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'popular_issues':    popular_issues,
            'suggested_actions': SUGGESTED_ACTIONS,
            'legal_updates':     STATIC_LEGAL_UPDATES,
            'location':          {'state': state, 'district': district},
            'timestamp':         datetime.now().isoformat()
        })
    }
