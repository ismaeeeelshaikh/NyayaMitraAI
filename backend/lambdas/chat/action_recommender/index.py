"""
Action Recommender — User ko kya karna chahiye suggest karta hai.
HARDCODED rules — Bedrock call nahi (cost bachao).
Risk level + domain + intent se action determine hota hai.
"""
import json

# ── Action definitions ──
# system_route: Frontend Member 4 is route pe navigate karega
ACTIONS = {
    'property': {
        'LOW': {
            'action_type':  'Send Legal Notice',
            'priority':     'MEDIUM',
            'timeline':     'Within 2 weeks',
            'reasoning':    'A legal notice is the first formal step in property disputes.',
            'steps': [
                'Collect all property documents (sale deed, tax receipts)',
                'Get a survey report from the Revenue Department',
                'Send registered legal notice to the opposite party',
                'Give 30-60 days to respond before court action'
            ],
            'cost':         'Low (~Rs. 500-2000 for drafting)',
            'system_route': '/complaint-generator?type=legal_notice'
        },
        'HIGH': {
            'action_type':  'Consult Legal Aid Immediately',
            'priority':     'HIGH',
            'timeline':     'Within 24 hours',
            'reasoning':    'High risk property dispute needs immediate professional help.',
            'steps': [
                'Contact nearest District Legal Aid Office',
                'Carry all property documents',
                'Get an emergency injunction if construction/encroachment is ongoing'
            ],
            'cost':         'Free (Legal Aid)',
            'system_route': '/legal-aid'
        }
    },
    'family': {
        'LOW': {
            'action_type':  'Consult Legal Aid',
            'priority':     'MEDIUM',
            'timeline':     'Within 1 week',
            'reasoning':    'Family law cases need professional guidance.',
            'steps': [
                'Visit District Legal Services Authority (DLSA)',
                'Bring marriage certificate and relevant documents',
                'Explore mediation first — faster and less adversarial'
            ],
            'cost':         'Free (DLSA)',
            'system_route': '/legal-aid'
        },
        'HIGH': {
            'action_type':  'File DV Act Complaint',
            'priority':     'URGENT',
            'timeline':     'Immediately',
            'reasoning':    'Domestic violence needs immediate police protection.',
            'steps': [
                'Go to nearest police station',
                'File complaint under DV Act 2005 and IPC 498A',
                'Ask for Protection Order from Magistrate',
                "Contact Women's Cell: 1091"
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=police'
        }
    },
    'consumer': {
        'LOW': {
            'action_type':  'File Consumer Complaint',
            'priority':     'MEDIUM',
            'timeline':     'Within 2 weeks',
            'reasoning':    'Consumer courts are fast — usually resolved in 3-6 months.',
            'steps': [
                'Collect proof of purchase (bill, invoice)',
                'Document the defect (photos/videos)',
                'Send complaint email to company first',
                'If no response in 15 days: file at edaakhil.nic.in'
            ],
            'cost':         'Rs. 200-4000 filing fee',
            'system_route': '/complaint-generator?type=consumer'
        },
        'HIGH': {
            'action_type':  'File Consumer Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 3 days',
            'reasoning':    'Urgent consumer fraud needs immediate action.',
            'steps': [
                'Call National Consumer Helpline: 1915',
                'File online at edaakhil.nic.in',
                'Also file police complaint for fraud'
            ],
            'cost':         'Free (helpline)',
            'system_route': '/complaint-generator?type=consumer'
        }
    },
    'criminal': {
        'LOW': {
            'action_type':  'File Police Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 24 hours',
            'reasoning':    'Criminal offences should be reported to police immediately.',
            'steps': [
                'Go to nearest police station',
                'Carry evidence/witnesses if any',
                'Demand FIR copy (your legal right)',
                'If police refuse: approach Magistrate under Section 156(3) CrPC'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=police'
        },
        'HIGH': {
            'action_type':  'File Police Complaint + Legal Aid',
            'priority':     'URGENT',
            'timeline':     'Immediately',
            'reasoning':    'High-risk criminal case needs both police action and legal representation.',
            'steps': [
                'Call Police: 100 immediately',
                'Go to police station to file FIR',
                'Contact Legal Aid for lawyer assistance',
                'Document everything: photos, witnesses'
            ],
            'cost':         'Free (Police + Legal Aid)',
            'system_route': '/legal-aid'
        }
    },
    'labor': {
        'LOW': {
            'action_type':  'File Labor Complaint',
            'priority':     'MEDIUM',
            'timeline':     'Within 1 week',
            'reasoning':    'Labor Commissioner handles salary and termination disputes.',
            'steps': [
                'Collect appointment letter and salary slips',
                'Give written complaint to employer first',
                'If unresolved: file with Labour Commissioner',
                'For PF issues: contact EPFO helpline 1800-118-005'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=labor'
        },
        'HIGH': {
            'action_type':  'Urgent Labor Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 48 hours',
            'reasoning':    'Immediate wage/termination issue needs quick action.',
            'steps': [
                'Contact Labour Commissioner immediately',
                'File for urgent injunction if being illegally terminated',
                'Contact District Legal Aid for free lawyer'
            ],
            'cost':         'Free',
            'system_route': '/legal-aid'
        }
    },
    'cyber': {
        'LOW': {
            'action_type':  'File Cyber Crime Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 24 hours',
            'reasoning':    'Digital evidence disappears quickly — report immediately.',
            'steps': [
                'Take screenshots of all evidence immediately',
                'File at cybercrime.gov.in',
                'For financial fraud: call 1930 immediately',
                'Also file at local police cyber cell'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=cyber'
        },
        'HIGH': {
            'action_type':  'Emergency Cyber Report',
            'priority':     'URGENT',
            'timeline':     'Immediately',
            'reasoning':    'Active cyber fraud — call 1930 in the golden hour.',
            'steps': [
                'Call Cyber Crime Helpline: 1930 NOW',
                'Block your bank cards immediately',
                'Take screenshots before blocking fraudster',
                'File at cybercrime.gov.in after calling'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=cyber'
        }
    },
    'general': {
        'LOW': {
            'action_type':  'Consult Legal Aid',
            'priority':     'MEDIUM',
            'timeline':     'Within 1 week',
            'reasoning':    'A legal professional can best advise on your specific situation.',
            'steps': [
                'Visit nearest District Legal Services Authority',
                'Describe your situation in detail',
                'Ask for free legal advice'
            ],
            'cost':         'Free',
            'system_route': '/legal-aid'
        },
        'HIGH': {
            'action_type':  'Immediate Legal Aid',
            'priority':     'URGENT',
            'timeline':     'Within 24 hours',
            'reasoning':    'Urgent situation needs immediate professional help.',
            'steps': [
                'Call Legal Aid helpline: 15100',
                'Visit nearest District Legal Services Authority',
                'Carry all relevant documents'
            ],
            'cost':         'Free',
            'system_route': '/legal-aid'
        }
    }
}

def handler(event, context):
    domain      = event.get('domain', 'general')
    risk_result = event.get('risk_assessment', {})
    risk_level  = risk_result.get('risk_level', 'LOW')
    intent      = event.get('intent', 'SeekLegalAdvice')

    # Emergency intent → always HIGH action
    if intent == 'EmergencyHelp':
        risk_level = 'HIGH'

    domain_actions = ACTIONS.get(domain, ACTIONS['general'])

    # HIGH ya MEDIUM risk → HIGH action; LOW → LOW action
    action_key = 'HIGH' if risk_level in ['HIGH', 'MEDIUM'] else 'LOW'
    action = domain_actions.get(action_key, domain_actions.get('LOW'))

    if not action:
        action = ACTIONS['general']['LOW']

    action['can_do_now'] = True
    action['domain']     = domain
    action['risk_level'] = risk_level

    if risk_level == 'HIGH':
        action['auto_escalate'] = True

    return {'primary_action': action}
