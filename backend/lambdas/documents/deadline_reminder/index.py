"""
Deadline Reminder Scheduler
EventBridge cron rules banata hai:
  1. Midpoint reminder
  2. 2 din pehle reminder
  3. Deadline ke din reminder
"""
import boto3
import json
import os
from datetime import datetime, timedelta, timezone

events_client = boto3.client('events', region_name='ap-south-1')

def schedule_rule(rule_name: str, target_date: datetime, payload: dict) -> bool:
    """EventBridge cron rule banao"""
    try:
        cron = (
            f"cron({target_date.minute} {target_date.hour} "
            f"{target_date.day} {target_date.month} ? {target_date.year})"
        )
        events_client.put_rule(
            Name=rule_name,
            ScheduleExpression=cron,
            State='ENABLED',
            Description=f"Nyaya Mitra deadline reminder for notice {payload.get('notice_id','')[:8]}"
        )
        return True
    except Exception as e:
        print(f"EventBridge rule failed ({rule_name}): {e}")
        return False

def handler(event, context):
    notice_id    = event.get('notice_id', '')
    deadline_str = event.get('deadline_date', '')
    days_rem     = int(event.get('days_remaining', 0))
    notice_type  = event.get('notice_type', 'Legal Notice')

    if not deadline_str or days_rem <= 0:
        return {'scheduled': 0, 'reason': 'No valid deadline'}

    try:
        deadline = datetime.strptime(deadline_str, '%Y-%m-%d').replace(
            hour=9, minute=0, tzinfo=timezone.utc
        )
    except ValueError:
        return {'scheduled': 0, 'reason': 'Invalid date format'}

    now       = datetime.now(timezone.utc)
    nid_short = notice_id[:8]
    scheduled = 0

    payload = {'notice_id': notice_id, 'notice_type': notice_type}

    # Reminder 1: Midpoint (agar 4+ din hain)
    if days_rem >= 4:
        midpoint = now + timedelta(days=days_rem // 2)
        if schedule_rule(f"nyaya-rem-mid-{nid_short}", midpoint, payload):
            scheduled += 1

    # Reminder 2: 2 din pehle
    if days_rem > 2:
        two_days_before = deadline - timedelta(days=2)
        if two_days_before > now:
            if schedule_rule(f"nyaya-rem-2d-{nid_short}", two_days_before, payload):
                scheduled += 1

    # Reminder 3: Deadline ke din (9 AM)
    if schedule_rule(f"nyaya-rem-due-{nid_short}", deadline, payload):
        scheduled += 1

    print(f"Notice {notice_id}: {scheduled} reminders scheduled for deadline {deadline_str}")
    return {'scheduled': scheduled, 'deadline': deadline_str}
