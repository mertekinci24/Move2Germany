
import { Home, Building2, FileText, Briefcase, Users, Settings } from 'lucide-react';

type SidebarProps = {
  currentView: string;
  onViewChange: (view: string) => void;
};

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'housing', label: 'Housing', icon: Building2 },
    { id: 'bureaucracy', label: 'Bureaucracy', icon: FileText },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Move2Germany</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
