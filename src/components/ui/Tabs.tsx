import { cn } from '../../lib/utils';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
    return (
        <div className={cn("flex space-x-1 bg-secondary-100 p-1 rounded-lg", className)}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center",
                        activeTab === tab.id
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-secondary-200/50"
                    )}
                >
                    {tab.icon && <span className="mr-2">{tab.icon}</span>}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
