import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant: 'pending' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant, size = 'md' }: BadgeProps) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-green-100 text-green-800 border-green-200',
    done: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  return (
    <span className={`font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
