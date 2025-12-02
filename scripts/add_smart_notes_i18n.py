#!/usr/bin/env python3
"""
Add i18n keys for Smart Notes UI
"""
import json
from pathlib import Path

def update_note_keys():
    new_keys = {
        'en': {
            'notes': {
                'relatedTask': 'Related Task',
                'selectTask': 'Select a task...',
                'eventDate': 'Event Date'
            }
        },
        'tr': {
            'notes': {
                'relatedTask': 'İlişkili Görev',
                'selectTask': 'Bir görev seçin...',
                'eventDate': 'Etkinlik Tarihi'
            }
        },
        'ar': {
            'notes': {
                'relatedTask': 'المهمة ذات الصلة',
                'selectTask': 'اختر مهمة...',
                'eventDate': 'تاريخ الحدث'
            }
        }
    }
    
    for locale_code, keys in new_keys.items():
        file_path = Path(f'src/locales/{locale_code}.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'notes' not in data:
            data['notes'] = {}
            
        data['notes'].update(keys['notes'])
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Updated {locale_code}.json with Smart Notes keys")

if __name__ == '__main__':
    update_note_keys()
