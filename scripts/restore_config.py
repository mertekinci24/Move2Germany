import json
from pathlib import Path

def restore_config():
    file_path = Path('config/move2germany_tasks_v1.json')
    
    # Read the current corrupted file (which is just the tasks list)
    with open(file_path, 'r', encoding='utf-8') as f:
        tasks = json.load(f)
    
    if not isinstance(tasks, list):
        print("File does not appear to be the corrupted list format. Aborting.")
        return

    # Reconstruct the full config structure
    full_config = {
        "cities": [
            {"id": "aachen", "name": "Aachen"},
            {"id": "berlin", "name": "Berlin"},
            {"id": "munich", "name": "Munich"},
            {"id": "frankfurt", "name": "Frankfurt"},
            {"id": "hamburg", "name": "Hamburg"}
        ],
        "timeWindows": [
            {"id": "pre_arrival", "label": "Pre-arrival (0-3 months before)"},
            {"id": "week_1", "label": "Week 1"},
            {"id": "weeks_2_4", "label": "Weeks 2-4"},
            {"id": "month_2", "label": "Month 2"},
            {"id": "month_3", "label": "Month 3"}
        ],
        "modules": [
            {"id": "housing", "label": "Housing", "icon": "home"},
            {"id": "bureaucracy", "label": "Bureaucracy", "icon": "file-text"},
            {"id": "work", "label": "Work", "icon": "briefcase"},
            {"id": "social", "label": "Social", "icon": "users"}
        ],
        "tasks": tasks
    }
    
    # Save the restored config
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(full_config, f, indent=2, ensure_ascii=False)
    
    print("✅ Config file restored with root keys (cities, timeWindows, modules)")

if __name__ == '__main__':
    restore_config()
