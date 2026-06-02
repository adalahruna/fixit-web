import { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export function Alert({ children, variant, className = '' }: AlertProps) {
  const variants = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-orange-50 border-orange-200 text-orange-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`border rounded-md px-4 py-3 text-sm ${variants[variant]} ${className}`}>
      <span className="mr-2">{icons[variant]}</span>
      {children}
    </div>
  );
}
