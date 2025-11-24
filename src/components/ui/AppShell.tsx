import { ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AppShellProps {
    sidebar: ReactNode;
    topBar: ReactNode;
    children: ReactNode;
    aiChat?: ReactNode;
}

export function AppShell({ sidebar, topBar, children, aiChat }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-secondary-50 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {sidebar}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-secondary-200">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-gray-900">Move2Germany</span>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                {/* Top Bar (Desktop) */}
                <div className="hidden lg:block">
                    {topBar}
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* AI Chat Bubble */}
            {aiChat && (
                <div className="fixed bottom-6 right-6 z-50">
                    {aiChat}
                </div>
            )}
        </div>
    );
}
