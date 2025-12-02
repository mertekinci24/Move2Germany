#!/usr/bin/env python3
"""
Add createLinked i18n key
"""
import json
from pathlib import Path

def update_keys():
    new_keys = {
        'en': { 'notes': { 'createLinked': 'Create Smart Note' } },
        'tr': { 'notes': { 'createLinked': 'Akıllı Not Oluştur' } },
        'ar': { 'notes': { 'createLinked': 'إنشاء ملاحظة ذكية' } }
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
        
        print(f"✓ Updated {locale_code}.json with createLinked key")

if __name__ == '__main__':
    update_keys()
