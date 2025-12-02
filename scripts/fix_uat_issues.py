#!/usr/bin/env python3
"""
V5.2.3 Hotfix Script: Fix UAT Critical Issues
- FIX-1: Update OverviewView.tsx to use dynamic currentPhase
- FIX-2: Update SubtaskList.tsx to add clickable platform URLs
"""
import re
from pathlib import Path

def fix_overview_view():
    """Fix hardcoded journey phase in OverviewView"""
    file_path = Path('src/components/views/OverviewView.tsx')
    content = file_path.read_text(encoding='utf-8')
    
    # Add import for useJourneyPhase
    if 'useJourneyPhase' not in content:
        content = content.replace(
            "import { useI18n } from '../../contexts/I18nContext';",
            "import { useI18n } from '../../contexts/I18nContext';\nimport { useJourneyPhase } from '../../contexts/JourneyPhaseContext';"
        )
    
    # Add hook call
    if '= useJourneyPhase();' not in content:
        content = content.replace(
            "const { t, locale } = useI18n();",
            "const { t, locale } = useI18n();\n  const { currentPhase } = useJourneyPhase();"
        )
    
    # Fix hardcoded phase badge
    old_pattern = r"{t\('journey\.currentPhase'\)}: {t\(`timeWindows\.\$\{configLoader\.getJourneyPhases\(\)\.find\(p => p\.id === 'week_1'\)\?\.id \|\| 'pre_arrival'\}`\)}"
    new_text = "{t('journey.currentPhase')}: {t(`timeWindows.${currentPhase.id}`)}"
    content = re.sub(old_pattern, new_text, content)
    
    file_path.write_text(content, encoding='utf-8')
    print("✓ Fixed OverviewView.tsx hardcoded journey phase")

def fix_subtask_list():
    """Add clickable URLs to external_action subtasks"""
    file_path = Path('src/components/tasks/SubtaskList.tsx')
    content = file_path.read_text(encoding='utf-8')
    
    # Add import for platform config
    if 'housingPlatformsConfig' not in content:
        content = content.replace(
            "import { useI18n } from '../../contexts/I18nContext';",
            "import { useI18n } from '../../contexts/I18nContext';\nimport housingPlatforms from '../../../config/housing_platforms.json';"
        )
    
    # Replace the external_action rendering to include links
    old_block = r'''                    {subtask\.providers\?\.map\(\(providerId: string\) => \{
                        const isProviderDone = actionProgress\[providerId\] \|\| false;
                        return \(
                            <div key=\{providerId\} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 capitalize">\{providerId\.replace\('_', ' '\)\}</span>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked=\{isProviderDone\}
                                        onChange=\{\(e\) => \{
                                            onMetadataChange\?\.\(subtask\.actionType, \{ \.\.\.actionProgress, \[providerId\]: e\.target\.checked \}\);
                                        \}\}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-500">Signed up</span>
                                </label>
                            </div>
                        \);
                    \}\)\}'''
    
    new_block = '''                    {subtask.providers?.map((providerId: string) => {
                        const isProviderDone = actionProgress[providerId] || false;
                        const platform = (housingPlatforms as any).platforms?.find((p: any) => p.id === providerId);
                        return (
                            <div key={providerId} className="flex items-center justify-between text-sm gap-2">
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400 capitalize">{providerId.replace('_', ' ')}</span>
                                    {platform && (
                                        <a 
                                            href={platform.baseUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
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
                    })}'''
    
    content = re.sub(old_block, new_block, content, flags=re.DOTALL)
    file_path.write_text(content, encoding='utf-8')
    print("✓ Fixed SubtaskList.tsx to show clickable platform URLs")

def main():
    try:
        fix_overview_view()
        fix_subtask_list()
        print("\n✅ All UAT hotfixes applied successfully!")
        return 0
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
