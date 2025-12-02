#!/usr/bin/env python3
"""Script to add form_criteria and external_action subtask types to Housing task"""
import json
import sys

# Read current config
with open('config/move2germany_tasks_v1.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# Find the housing task
for task in config['tasks']:
    if task['id'] == 'kira-oda-ilanlarini-takip-et':
        # Update subtasks with new types
        for subtask in task['subtasks']:
            if subtask['id'] == 'define_budget':
                subtask['type'] = 'form_criteria'
                subtask['criteriaKey'] = 'housing_preferences'
                subtask['fields'] = ['maxRent', 'minSize', 'roomType']
            elif subtask['id'] == 'create_accounts':
                subtask['type'] = 'external_action'
                subtask['actionType'] = 'housing_platform_signup'
                subtask['providers'] = ['wg_gesucht', 'immoscout24', 'ebay_kleinanzeigen']
        print(f"✓ Updated {len(task['subtasks'])} subtasks in Housing task")
        break
else:
    print("✗ Housing task not found!", file=sys.stderr)
    sys.exit(1)

# Write back with pretty formatting
with open('config/move2germany_tasks_v1.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
    
print("✓ Config file updated successfully")
