import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-300 disabled:text-gray-600',
      secondary: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-gray-300 disabled:text-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-300 disabled:text-gray-600',
      warning: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 disabled:bg-gray-300 disabled:text-gray-600',
      ghost: 'text-blue-600 hover:text-blue-700 hover:underline focus:ring-blue-500 disabled:text-gray-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const disabledStyles = 'disabled:cursor-not-allowed';
    const widthStyles = fullWidth ? 'w-full' : '';
    const loadingStyles = loading ? 'cursor-wait' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${widthStyles} ${loadingStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? 'Memproses...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
