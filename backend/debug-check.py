"""Quick debug: check DynamoDB tables + test Lambda invoke"""
import boto3, json

region = 'ap-south-1'
ddb = boto3.client('dynamodb', region_name=region)
lam = boto3.client('lambda', region_name=region)

# Check tables
print("=== DynamoDB Tables ===")
tables = ddb.list_tables()['TableNames']
print(f"Found {len(tables)} tables:")
for t in tables:
    print(f"  - {t}")

if len(tables) == 0:
    print("\n  NO TABLES FOUND! Tables were not created properly.")
    print("  Will create them now with Python boto3...")
    
    simple_tables = [
        ('nyaya-mitra-users', 'user_id'),
        ('nyaya-mitra-sessions', 'session_id'),
        ('nyaya-mitra-connections', 'connection_id'),
        ('nyaya-mitra-risk-assessments', 'assessment_id'),
        ('nyaya-mitra-timelines', 'timeline_id'),
        ('nyaya-mitra-complaints', 'complaint_id'),
        ('nyaya-mitra-scanned-notices', 'notice_id'),
        ('nyaya-mitra-legal-aid-partners', 'partner_id'),
        ('nyaya-mitra-escalation-logs', 'escalation_id'),
        ('nyaya-mitra-case-referrals', 'referral_id'),
    ]
    
    composite_tables = [
        ('nyaya-mitra-chat-history', 'session_id', 'timestamp'),
        ('nyaya-mitra-complaint-analytics', 'state_district', 'timestamp'),
    ]
    
    for tname, pk in simple_tables:
        try:
            ddb.create_table(
                TableName=tname,
                KeySchema=[{'AttributeName': pk, 'KeyType': 'HASH'}],
                AttributeDefinitions=[{'AttributeName': pk, 'AttributeType': 'S'}],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"  CREATED: {tname}")
        except ddb.exceptions.ResourceInUseException:
            print(f"  EXISTS:  {tname}")
        except Exception as e:
            print(f"  ERROR:   {tname} - {e}")
    
    for tname, pk, sk in composite_tables:
        try:
            ddb.create_table(
                TableName=tname,
                KeySchema=[
                    {'AttributeName': pk, 'KeyType': 'HASH'},
                    {'AttributeName': sk, 'KeyType': 'RANGE'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': pk, 'AttributeType': 'S'},
                    {'AttributeName': sk, 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"  CREATED: {tname}")
        except ddb.exceptions.ResourceInUseException:
            print(f"  EXISTS:  {tname}")
        except Exception as e:
            print(f"  ERROR:   {tname} - {e}")
    
    import time
    print("\n  Waiting 10s for tables to activate...")
    time.sleep(10)
    
    # Enable TTL
    for tname in ['nyaya-mitra-sessions', 'nyaya-mitra-chat-history', 'nyaya-mitra-connections']:
        try:
            ddb.update_time_to_live(
                TableName=tname,
                TimeToLiveSpecification={'Enabled': True, 'AttributeName': 'ttl'}
            )
            print(f"  TTL enabled: {tname}")
        except Exception as e:
            print(f"  TTL skip:   {tname} - {e}")
    
    # Recheck
    tables = ddb.list_tables()['TableNames']
    print(f"\n  After creation: {len(tables)} tables found")

# Test Lambda invoke
print("\n=== Lambda Invoke Tests ===")

# Risk Scorer
print("\n1. Risk Scorer:")
try:
    resp = lam.invoke(
        FunctionName='nyaya-mitra-risk-scorer',
        Payload=json.dumps({
            'text': 'My husband is threatening to kill me',
            'urgency': 'HIGH',
            'domain': 'family'
        })
    )
    result = json.loads(resp['Payload'].read())
    print(f"   Score: {result.get('risk_score')}")
    print(f"   Level: {result.get('risk_level')}")
    print(f"   Breakdown: {result.get('breakdown')}")
    print("   PASS!")
except Exception as e:
    print(f"   ERROR: {e}")

# Action Recommender
print("\n2. Action Recommender:")
try:
    resp = lam.invoke(
        FunctionName='nyaya-mitra-action-recommender',
        Payload=json.dumps({
            'domain': 'criminal',
            'risk_assessment': {'risk_level': 'HIGH'},
            'intent': 'EmergencyHelp'
        })
    )
    result = json.loads(resp['Payload'].read())
    action = result.get('primary_action', {})
    print(f"   Action: {action.get('action_type')}")
    print(f"   Priority: {action.get('priority')}")
    print(f"   Timeline: {action.get('timeline')}")
    print("   PASS!")
except Exception as e:
    print(f"   ERROR: {e}")

# Session Handler
print("\n3. Session Handler:")
try:
    resp = lam.invoke(
        FunctionName='nyaya-mitra-session-handler',
        Payload=json.dumps({
            'body': json.dumps({
                'language_code': 'en',
                'mode_selection': 'chat',
                'anonymous_mode': True
            })
        })
    )
    result = json.loads(resp['Payload'].read())
    if result.get('statusCode') == 200:
        body = json.loads(result['body'])
        print(f"   Session ID: {body.get('session_id')}")
        print(f"   Query Limit: {body.get('query_limit_remaining')}")
        print("   PASS!")
    else:
        print(f"   Status: {result.get('statusCode')}")
        print(f"   Body: {result.get('body')}")
        if 'errorMessage' in result:
            print(f"   Error: {result.get('errorMessage')}")
except Exception as e:
    print(f"   ERROR: {e}")

print("\n=== Debug Complete ===")
