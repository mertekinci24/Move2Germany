import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 p-3 rounded-full mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {action ? action : (actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            ))}
        </div>
    );
}
