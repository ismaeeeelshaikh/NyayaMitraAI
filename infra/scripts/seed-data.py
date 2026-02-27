"""
Demo data DynamoDB mein daalte hain.
Run karo deploy ke baad ek baar.
"""
import boto3
import uuid
import random
from datetime import datetime, timedelta, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

STATES_DISTRICTS = {
    'MH': ['MUMBAI', 'PUNE', 'NASHIK', 'NAGPUR', 'THANE'],
    'DL': ['CENTRAL', 'NORTH', 'SOUTH', 'EAST', 'WEST'],
    'UP': ['LUCKNOW', 'KANPUR', 'AGRA', 'VARANASI', 'ALLAHABAD'],
    'KA': ['BENGALURU', 'MYSURU', 'HUBLI'],
    'TN': ['CHENNAI', 'COIMBATORE', 'MADURAI'],
    'RJ': ['JAIPUR', 'JODHPUR', 'UDAIPUR']
}
ISSUES = ['property', 'family', 'consumer', 'criminal', 'labor', 'cyber']

def seed_legal_aid_partners():
    table = dynamodb.Table('nyaya-mitra-legal-aid-partners')
    partners = [
        {
            'partner_id': str(uuid.uuid4()),
            'organization_name': 'Mumbai District Legal Aid Office',
            'type': 'govt',
            'state': 'MH',
            'district': 'MUMBAI',
            'phone': '022-22621234',
            'email': 'dla.mumbai@mahajudiciary.gov.in',
            'address': 'Court Complex, Fort, Mumbai - 400001',
            'specializations': ['property', 'family', 'consumer', 'criminal', 'labor'],
            'languages_supported': ['hi', 'en', 'mr'],
            'availability_status': 'active',
            'rating': 4.8,
            'response_time_avg_hours': 24,
            'cases_handled_total': 1247,
            'free_service': True,
            'eligibility_criteria': 'Annual income below Rs. 3 lakh',
            'verified': True,
            'registration_date': '2023-01-15',
            'current_case_load': 45,
            'max_capacity': 100
        },
        {
            'partner_id': str(uuid.uuid4()),
            'organization_name': 'Delhi Legal Services Authority',
            'type': 'govt',
            'state': 'DL',
            'district': 'CENTRAL',
            'phone': '011-23385015',
            'email': 'dlsa@nic.in',
            'address': 'Patiala House Courts, New Delhi - 110001',
            'specializations': ['criminal', 'family', 'labor', 'property'],
            'languages_supported': ['hi', 'en'],
            'availability_status': 'active',
            'rating': 4.5,
            'response_time_avg_hours': 24,
            'cases_handled_total': 3421,
            'free_service': True,
            'eligibility_criteria': 'All eligible citizens including women, SC/ST',
            'verified': True,
            'registration_date': '2022-06-01',
            'current_case_load': 89,
            'max_capacity': 200
        },
        {
            'partner_id': str(uuid.uuid4()),
            'organization_name': 'Nyaya Foundation - Pune',
            'type': 'ngo',
            'state': 'MH',
            'district': 'PUNE',
            'phone': '020-25651234',
            'email': 'contact@nyayafoundation.org',
            'address': 'Shivajinagar, Pune - 411005',
            'specializations': ['family', 'property', 'consumer'],
            'languages_supported': ['hi', 'en', 'mr'],
            'availability_status': 'active',
            'rating': 4.2,
            'response_time_avg_hours': 48,
            'cases_handled_total': 567,
            'free_service': True,
            'eligibility_criteria': 'Marginalized communities, women, SC/ST',
            'verified': True,
            'registration_date': '2023-03-15',
            'current_case_load': 23,
            'max_capacity': 50
        },
        {
            'partner_id': str(uuid.uuid4()),
            'organization_name': 'Legal Aid Bangalore',
            'type': 'govt',
            'state': 'KA',
            'district': 'BENGALURU',
            'phone': '080-22942444',
            'email': 'dlsa.bangalore@kar.gov.in',
            'address': 'City Civil Courts Complex, Bangalore - 560001',
            'specializations': ['consumer', 'labor', 'cyber', 'property'],
            'languages_supported': ['hi', 'en', 'kn'],
            'availability_status': 'active',
            'rating': 4.6,
            'response_time_avg_hours': 12,
            'cases_handled_total': 2156,
            'free_service': True,
            'eligibility_criteria': 'Annual income below Rs. 5 lakh',
            'verified': True,
            'registration_date': '2022-09-20',
            'current_case_load': 67,
            'max_capacity': 150
        }
    ]

    for p in partners:
        table.put_item(Item=p)
    print(f"  ✅ {len(partners)} legal aid partners seeded")

def seed_analytics():
    table = dynamodb.Table('nyaya-mitra-complaint-analytics')
    count = 0
    for state, districts in STATES_DISTRICTS.items():
        for district in districts[:2]:  # Top 2 districts per state
            key = f"{state}_{district}"
            for issue in ISSUES:
                for days_ago in range(30):
                    date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
                    table.put_item(Item={
                        'state_district': key,
                        'timestamp': f"{date}_{issue}",
                        'issue_type': issue,
                        'count': random.randint(5, 80),
                        'avg_risk_score': round(random.uniform(20, 80), 1),
                        'resolution_rate': round(random.uniform(0.3, 0.9), 2)
                    })
                    count += 1
    print(f"  ✅ {count} analytics records seeded")

if __name__ == '__main__':
    print("Seeding demo data...")
    seed_legal_aid_partners()
    seed_analytics()
    print("✅ Seed data complete!")
