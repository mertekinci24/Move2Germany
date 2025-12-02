import json
from pathlib import Path

def update_services():
    file_path = Path('config/external_services.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Add Language Learning Category
    data['categories']['language'] = {
        "label": "Language Learning",
        "services": [
            {
                "id": "tandem",
                "name": "Tandem",
                "baseUrl": "https://www.tandem.net",
                "description": "Find language exchange partners worldwide"
            },
            {
                "id": "babbel",
                "name": "Babbel",
                "baseUrl": "https://www.babbel.com",
                "description": "Language learning app with focus on conversation"
            },
            {
                "id": "duolingo",
                "name": "Duolingo",
                "baseUrl": "https://www.duolingo.com",
                "description": "Gamified language learning platform"
            }
        ]
    }

    # Add Eventbrite to Social
    social_services = data['categories']['social']['services']
    if not any(s['id'] == 'eventbrite' for s in social_services):
        social_services.append({
            "id": "eventbrite",
            "name": "Eventbrite",
            "baseUrl": "https://www.eventbrite.de",
            "description": "Discover local events and things to do"
        })
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("✅ Updated external_services.json with Language category and Eventbrite")

def inject_social_tasks():
    tasks_path = Path('config/move2germany_tasks_v1.json')
    with open(tasks_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    new_tasks = [
        {
            "id": "join_expat_communities",
            "timeWindow": "week_1",
            "module": "social",
            "title": "Expat topluluklarına katıl",
            "description": "Diğer expatlarla tanışmak ve destek ağı oluşturmak için topluluklara katıl.",
            "dependencies": [],
            "importance": "high",
            "repeat": "recurring",
            "cityScope": ["aachen", "berlin", "munich", "frankfurt", "hamburg"],
            "subtasks": [
                {
                    "id": "join_platforms",
                    "title": "Topluluk platformlarına üye olun",
                    "type": "external_action",
                    "actionType": "social_platform_join",
                    "providers": ["meetup", "internations", "facebook_groups"],
                    "required": True
                }
            ]
        },
        {
            "id": "practice_language",
            "timeWindow": "weeks_2_4",
            "module": "social",
            "title": "Dil pratiği yap",
            "description": "Dil değişim partnerleri bularak Almanca pratiği yap.",
            "dependencies": [],
            "importance": "medium",
            "repeat": "recurring",
            "cityScope": ["aachen", "berlin", "munich", "frankfurt", "hamburg"],
            "subtasks": [
                {
                    "id": "language_apps",
                    "title": "Dil öğrenme uygulamalarını kullanın",
                    "type": "external_action",
                    "actionType": "language_practice",
                    "providers": ["tandem", "babbel", "duolingo"],
                    "required": True
                }
            ]
        },
        {
            "id": "discover_local_events",
            "timeWindow": "weeks_2_4",
            "module": "social",
            "title": "Yerel etkinlikleri keşfet",
            "description": "Konserler, festivaller ve yerel buluşmalar için etkinlik takvimlerini kontrol et.",
            "dependencies": [],
            "importance": "medium",
            "repeat": "recurring",
            "cityScope": ["aachen", "berlin", "munich", "frankfurt", "hamburg"],
            "subtasks": [
                {
                    "id": "check_events",
                    "title": "Etkinlik platformlarını inceleyin",
                    "type": "external_action",
                    "actionType": "event_discovery",
                    "providers": ["eventbrite", "facebook_groups", "meetup"],
                    "required": True
                }
            ]
        }
    ]

    # Check for duplicates before adding
    existing_ids = {t['id'] for t in config['tasks']}
    added_count = 0
    
    for task in new_tasks:
        if task['id'] not in existing_ids:
            config['tasks'].append(task)
            added_count += 1
    
    with open(tasks_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"✅ Injected {added_count} new social tasks into move2germany_tasks_v1.json")

if __name__ == '__main__':
    update_services()
    inject_social_tasks()
