#!/usr/bin/env python3
"""
Complete i18n update script for V5.2.3 Advanced Subtask UI Implementation
Updates: config overlays (EN/AR) and locale files (en/tr/ar)
"""
import json
import sys
from pathlib import Path

def update_config_overlays():
    """Update English and Arabic config overlay files - no changes needed as titles are already translated"""
    print("ℹ Config overlays (EN/AR): No changes needed - subtask titles already translated in existing overlays")
    return True

def update_locale_file(locale_path, locale_code):
    """Add subtask UI keys to a locale file"""
    with open(locale_path, 'r', encoding='utf-8') as f:
        locale_data = json.load(f)
    
    # Ensure tasks.subtask structure exists
    if 'tasks' not in locale_data:
        locale_data['tasks'] = {}
    if 'subtask' not in locale_data['tasks']:
        locale_data['tasks']['subtask'] = {}
    
    # Define translations per locale
    translations = {
        'en': {
            'formCriteria': {
                'maxRent': 'Maximum Rent (€)',
                'minSize': 'Minimum Size (m²)',
                'roomType': 'Room Type',
                'placeholder': 'Enter value...'
            },
            'externalAction': {
                'signedUp': 'Signed up',
                'openPlatform': 'Visit Platform'
            }
        },
        'tr': {
            'formCriteria': {
                'maxRent': 'Maksimum Kira (€)',
                'minSize': 'Minimum Boyut (m²)',
                'roomType': 'Oda Tipi',
                'placeholder': 'Değer girin...'
            },
            'externalAction': {
                'signedUp': 'Kayıt olundu',
                'openPlatform': 'Platformu Ziyaret Et'
            }
        },
        'ar': {
            'formCriteria': {
                'maxRent': 'الحد الأقصى للإيجار (€)',
                'minSize': 'الحد الأدنى للمساحة (m²)',
                'roomType': 'نوع الغرفة',
                'placeholder': 'أدخل القيمة...'
            },
            'externalAction': {
                'signedUp': 'تم التسجيل',
                'openPlatform': 'زيارة المنصة'
            }
        }
    }
    
    if locale_code not in translations:
        print(f"✗ Unknown locale: {locale_code}", file=sys.stderr)
        return False
    
    # Add the new keys
    locale_data['tasks']['subtask'].update(translations[locale_code])
    
    # Write back with pretty formatting
    with open(locale_path, 'w', encoding='utf-8') as f:
        json.dump(locale_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {locale_path.name} with subtask UI keys")
    return True

def main():
    base_dir = Path(__file__).parent.parent
    
    print("=" * 60)
    print("V5.2.3 Subtask i18n Update Script")
    print("=" * 60)
    
    # Step 1: Config overlays (no-op, already correct)
    update_config_overlays()
    
    # Step 2: Update locale files
    print("\n📝 Updating locale files...")
    locale_files = [
        ('src/locales/en.json', 'en'),
        ('src/locales/tr.json', 'tr'),
        ('src/locales/ar.json', 'ar')
    ]
    
    all_success = True
    for locale_file, locale_code in locale_files:
        locale_path = base_dir / locale_file
        if not locale_path.exists():
            print(f"✗ Locale file not found: {locale_path}", file=sys.stderr)
            all_success = False
            continue
        
        if not update_locale_file(locale_path, locale_code):
            all_success = False
    
    print("\n" + "=" * 60)
    if all_success:
        print("✅ All i18n files updated successfully!")
        print("\nNext steps:")
        print("  1. Run: npm run build")
        print("  2. Run: npm test")
        return 0
    else:
        print("❌ Some updates failed. Check errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
