#!/usr/bin/env python3
"""Add user subtask i18n keys to locale files"""
import json
from pathlib import Path

def add_keys():
    locales = {
        'en': {
            'custom': {
                'badge': 'Custom',
                'add': 'Add your own subtask',
                'placeholder': 'Enter subtask title...',
                'save': 'Save',
                'cancel': 'Cancel',
                'deleteConfirm': 'Delete this custom subtask?'
            }
        },
        'tr': {
            'custom': {
                'badge': 'Özel',
                'add': 'Kendi alt görevinizi ekleyin',
                'placeholder': 'Alt görev başlığı girin...',
                'save': 'Kaydet',
                'cancel': 'İptal',
                'deleteConfirm': 'Bu özel alt görev silinsin mi?'
            }
        },
        'ar': {
            'custom': {
                'badge': 'مخصص',
                'add': 'أضف مهمتك الفرعية الخاصة',
                'placeholder': 'أدخل عنوان المهمة الفرعية...',
                'save': 'حفظ',
                'cancel': 'إلغاء',
                'deleteConfirm': 'حذف هذه المهمة الفرعية المخصصة?'
            }
        }
    }
    
    for locale_code, new_keys in locales.items():
        file_path = Path(f'src/locales/{locale_code}.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add custom key under tasks.subtask
        if 'tasks' not in data:
            data['tasks'] = {}
        if 'subtask' not in data['tasks']:
            data['tasks']['subtask'] = {}
        
        data['tasks']['subtask']['custom'] = new_keys['custom']
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Updated {locale_code}.json with custom subtask keys")

if __name__ == '__main__':
    add_keys()
    print("\n✅ All locale files updated")
