import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, required, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none text-gray-900 font-medium placeholder:text-gray-400
                     ${
                       error
                         ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                         : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400'
                     } 
                     disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                     ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-700 mt-2 font-medium">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-700 mt-2 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
