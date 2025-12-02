#!/usr/bin/env python3
"""
Add i18n keys for new social content
"""
import json
from pathlib import Path

def update_locales():
    locales = {
        'en': {
            'services': {
                'language': {
                    'tandem': 'Tandem',
                    'babbel': 'Babbel',
                    'duolingo': 'Duolingo'
                },
                'social': {
                    'eventbrite': 'Eventbrite'
                }
            }
        },
        'tr': {
            'services': {
                'language': {
                    'tandem': 'Tandem',
                    'babbel': 'Babbel',
                    'duolingo': 'Duolingo'
                },
                'social': {
                    'eventbrite': 'Eventbrite'
                }
            }
        },
        'ar': {
            'services': {
                'language': {
                    'tandem': 'تانديم (Tandem)',
                    'babbel': 'بابل (Babbel)',
                    'duolingo': 'دوولينجو (Duolingo)'
                },
                'social': {
                    'eventbrite': 'إيفينت برايت (Eventbrite)'
                }
            }
        }
    }
    
    for locale_code, new_keys in locales.items():
        file_path = Path(f'src/locales/{locale_code}.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add service translations
        if 'services' not in data:
            data['services'] = {}
        
        # Language services
        if 'language' not in data['services']:
            data['services']['language'] = {}
        data['services']['language'].update(new_keys['services']['language'])
        
        # Social services
        if 'social' not in data['services']:
            data['services']['social'] = {}
        data['services']['social'].update(new_keys['services']['social'])
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Updated {locale_code}.json with social service keys")

if __name__ == '__main__':
    update_locales()
