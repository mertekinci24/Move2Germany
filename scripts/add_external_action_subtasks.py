#!/usr/bin/env python3
"""
Add external_action subtasks to tasks across all modules
"""
import json
from pathlib import Path

def add_external_subtasks():
    file_path = Path('config/move2germany_tasks_v1.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check if data is array or object
    if isinstance(data, list):
        tasks = data
    else:
        tasks = data.get('tasks', [])
    
    updates = []
    
    # Find and update specific tasks
    for task in tasks:
        # 1. Health Insurance (Bureaucracy) - ID: saglik-sigortasini-sec
        if task['id'] == 'saglik-sigortasini-sec':
            if 'subtasks' not in task:
                task['subtasks'] = []
            # Check if subtask already exists to avoid duplicates
            if not any(s.get('id') == 'compare_providers' for s in task['subtasks']):
                task['subtasks'].append({
                    "id": "compare_providers",
                    "title": "Sağlık sigortası sağlayıcılarını karşılaştırın",
                    "type": "external_action",
                    "actionType": "insurance_comparison",
                    "providers": ["tk_health", "aok_health", "dak_health"],
                    "required": True
                })
                updates.append(f"✓ Updated {task['id']}: Added health insurance provider links")
        
        # 2. Bank Account (Bureaucracy) - ID: banka-hesabi-ac
        elif task['id'] == 'banka-hesabi-ac':
            if 'subtasks' not in task:
                task['subtasks'] = []
            if not any(s.get('id') == 'choose_bank' for s in task['subtasks']):
                task['subtasks'].append({
                    "id": "choose_bank",
                    "title": "Banka seçin ve online başvuru yapın",
                    "type": "external_action",
                    "actionType": "bank_signup",
                    "providers": ["n26", "deutsche_bank", "sparkasse"],
                    "required": True
                })
                updates.append(f"✓ Updated {task['id']}: Added banking platform links")
        
        # 3. Anmeldung Appointment (Bureaucracy) - ID: anmeldung-icin-randevu-al
        elif task['id'] == 'anmeldung-icin-randevu-al':
            if 'subtasks' not in task:
                task['subtasks'] = []
            if not any(s.get('id') == 'book_appointment' for s in task['subtasks']):
                task['subtasks'].append({
                    "id": "book_appointment",
                    "title": "Bürgeramt randevusu online alın",
                    "type": "external_action",
                    "actionType": "government_appointment",
                    "providers": ["buergeramt_termin"],
                    "required": True
                })
                updates.append(f"✓ Updated {task['id']}: Added Bürgeramt appointment link")
        
        # 4. Job Search (Work module) - ID: ilan-sitelerine-kaydol
        elif task['id'] == 'ilan-sitelerine-kaydol':
            if 'subtasks' not in task:
                task['subtasks'] = []
            if not any(s.get('id') == 'create_profiles' for s in task['subtasks']):
                task['subtasks'].append({
                    "id": "create_profiles",
                    "title": "İş platformlarında profil oluşturun",
                    "type": "external_action",
                    "actionType": "job_platform_signup",
                    "providers": ["stepstone", "linkedin", "indeed", "arbeitsagentur"],
                    "required": True
                })
                updates.append(f"✓ Updated {task['id']}: Added job platform links")
        
        # 5. Social/Community (Social module) - ID: kulup-gruba-katil
        elif task['id'] == 'kulup-gruba-katil':
            if 'subtasks' not in task:
                task['subtasks'] = []
            if not any(s.get('id') == 'join_communities' for s in task['subtasks']):
                task['subtasks'].append({
                    "id": "join_communities",
                    "title": "Expat topluluklarına katılın",
                    "type": "external_action",
                    "actionType": "social_platform_join",
                    "providers": ["meetup", "internations", "facebook_groups"],
                    "required": True
                })
                updates.append(f"✓ Updated {task['id']}: Added social platform links")
    
    # Write back the FULL data object, not just the tasks list
    # If we started with a list (corrupted state), we should ideally restore it, 
    # but for this script's purpose, we just save what we have. 
    # However, since we just restored it, 'data' should be a dict.
    
    if isinstance(data, dict):
        data['tasks'] = tasks
        output_data = data
    else:
        # If it was a list, we are still in a bad state, but let's just save the list 
        # (though the restore script should have been run first)
        output_data = tasks

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    return updates

def main():
    print("=" * 60)
    print("V5.2.5: Adding External Action Subtasks to Tasks")
    print("=" * 60)
    
    try:
        updates = add_external_subtasks()
        
        print("\n📝 Updates Applied:")
        for update in updates:
            print(f"  {update}")
        
        print(f"\n✅ Total tasks updated: {len(updates)}")
        print("\nNext: Run 'npm run build' to verify")
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
