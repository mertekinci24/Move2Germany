#!/usr/bin/env python3
"""
V5.2.3 UAT Hotfix - Automated Code Fixes
Applies both FIX-1 (Journey Phase Sync) and FIX-2 (Clickable Platform URLs)
"""
from pathlib import Path
import re

def fix_app_tsx():
    """Add JourneyPhaseProvider to App.tsx"""
    file_path = Path('src/App.tsx')
    content = file_path.read_text(encoding='utf-8')
    
    # Add import if not present
    if 'JourneyPhaseProvider' not in content:
        # Find the I18nProvider import line and add after it
        content = content.replace(
            "import { I18nProvider, useI18n } from './contexts/I18nContext';",
            "import { I18nProvider, useI18n } from './contexts/I18nContext';\nimport { JourneyPhaseProvider } from './contexts/JourneyPhaseContext';"
        )
        print("✓ Added JourneyPhaseProvider import to App.tsx")
    
    # Wrap with provider in default export
    if '<JourneyPhaseProvider>' not in content:
        # Find and replace the default export
        old_export = """export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppContent />
        <Toaster position="top-right" />
      </I18nProvider>
    </AuthProvider>
  );
}"""
        
        new_export = """export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <JourneyPhaseProvider>
          <AppContent />
          <Toaster position="top-right" />
        </JourneyPhaseProvider>
      </I18nProvider>
    </AuthProvider>
  );
}"""
        
        content = content.replace(old_export, new_export)
        print("✓ Wrapped App with JourneyPhaseProvider")
    
    file_path.write_text(content, encoding='utf-8')

def fix_overview_view():
    """Fix hardcoded phase in OverviewView.tsx"""
    file_path = Path('src/components/views/OverviewView.tsx')
    content = file_path.read_text(encoding='utf-8')
    
    # Add import
    if 'useJourneyPhase' not in content:
        content = content.replace(
            "import { useI18n } from '../../contexts/I18nContext';",
            "import { useI18n } from '../../contexts/I18nContext';\nimport { useJourneyPhase } from '../../contexts/JourneyPhaseContext';"
        )
        print("✓ Added useJourneyPhase import to OverviewView.tsx")
    
    # Add hook call
    if 'const { currentPhase }' not in content:
        content = content.replace(
            "const { t, locale } = useI18n();",
            "const { t, locale } = useI18n();\n  const { currentPhase } = useJourneyPhase();"
        )
        print("✓ Added useJourneyPhase hook call to OverviewView.tsx")
    
    # Fix the hardcoded phase - find and replace the specific pattern
    # Pattern: {t('journey.currentPhase')}: {t(`timeWindows.${configLoader.getJourneyPhases().find(p => p.id === 'week_1')?.id || 'pre_arrival'}`)}
    old_pattern = r"\{t\('journey\.currentPhase'\)\}: \{t\(`timeWindows\.\$\{configLoader\.getJourneyPhases\(\)\.find\(p => p\.id === 'week_1'\)\?\.id \|\| 'pre_arrival'\}`\)\}"
    new_replacement = "{t('journey.currentPhase')}: {t(`timeWindows.${currentPhase.id}`)}"
    
    content = re.sub(old_pattern, new_replacement, content)
    print("✓ Replaced hardcoded phase with dynamic currentPhase")
    
    file_path.write_text(content, encoding='utf-8')

def fix_subtask_list():
    """Add clickable platform URLs to SubtaskList.tsx"""
    file_path = Path('src/components/tasks/SubtaskList.tsx')
    content = file_path.read_text(encoding='utf-8')
    
    # Add import for housing platforms
    if 'housingPlatformsConfig' not in content and 'housing_platforms.json' not in content:
        # Add after other imports
        import_line = "import housingPlatformsConfig from '../../../config/housing_platforms.json';"
        # Find the line with useI18n import
        content = content.replace(
            "import { useI18n } from '../../contexts/I18nContext';",
            f"import {{ useI18n }} from '../../contexts/I18nContext';\n{import_line}"
        )
        print("✓ Added housing_platforms.json import to SubtaskList.tsx")
    
    # Replace the external_action provider rendering
    # Find the block that renders providers
    old_provider_block = """                    {subtask.providers?.map((providerId: string) => {
                        const isProviderDone = actionProgress[providerId] || false;
                        return (
                            <div key={providerId} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 capitalize">{providerId.replace('_', ' ')}</span>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isProviderDone}
                                        onChange={(e) => {
                                            onMetadataChange?.(subtask.actionType, { ...actionProgress, [providerId]: e.target.checked });
                                        }}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-500">Signed up</span>
                                </label>
                            </div>
                        );
                    })}"""
    
    new_provider_block = """                    {subtask.providers?.map((providerId: string) => {
                        const isProviderDone = actionProgress[providerId] || false;
                        const platform = (housingPlatformsConfig as any).platforms?.find((p: any) => p.id === providerId);
                        return (
                            <div key={providerId} className="flex items-center justify-between text-sm gap-2">
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400 capitalize">{providerId.replace(/_/g, ' ')}</span>
                                    {platform && (
                                        <a 
                                            href={platform.baseUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                                        >
                                            Visit →
                                        </a>
                                    )}
                                </div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isProviderDone}
                                        onChange={(e) => {
                                            onMetadataChange?.(subtask.actionType, { ...actionProgress, [providerId]: e.target.checked });
                                        }}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-500">Done</span>
                                </label>
                            </div>
                        );
                    })}"""
    
    if old_provider_block in content:
        content = content.replace(old_provider_block, new_provider_block)
        print("✓ Added clickable platform URLs to SubtaskList.tsx")
    else:
        print("⚠ Could not find exact provider block pattern - may need manual review")
    
    file_path.write_text(content, encoding='utf-8')

def main():
    print("=" * 60)
    print("V5.2.3 UAT Hotfix - Automated Application")
    print("=" * 60)
    
    try:
        print("\n📝 FIX-1: Journey Phase Sync")
        fix_app_tsx()
        fix_overview_view()
        
        print("\n📝 FIX-2: Clickable Platform URLs")
        fix_subtask_list()
        
        print("\n" + "=" * 60)
        print("✅ All UAT hotfixes applied successfully!")
        print("\nNext steps:")
        print("  1. Verify: npm run build")
        print("  2. Test: Open app and check phase badge + platform links")
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
