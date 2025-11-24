import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
    size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'primary', size = 'md', children, ...props }: BadgeProps) {
    const variants = {
        primary: 'bg-primary-50 text-primary-700 border-primary-200',
        secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
        success: 'bg-success-50 text-success-700 border-success-200',
        warning: 'bg-warning-50 text-warning-700 border-warning-200',
        danger: 'bg-danger-50 text-danger-700 border-danger-200',
        neutral: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full border',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
