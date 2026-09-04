
import React from 'react';

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  size?: 'sm' | 'md';
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, size = 'md', className = '', ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-9 h-5',
      md: 'w-11 h-6',
    };

    const thumbStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
    };

    const translateStyles = {
      sm: 'translate-x-4',
      md: 'translate-x-5',
    };

    return (
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative inline-block">
          <input
            ref={ref}
            type="checkbox"
            className={`
              appearance-none bg-slate-200 border-none
              rounded-full cursor-pointer transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              checked:bg-blue-600
              ${sizeStyles[size]}
              ${className}
            `}
            {...props}
          />
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 left-0.5 bg-white rounded-full
              shadow-sm transition-transform duration-200 pointer-events-none
              ${thumbStyles[size]}
              ${props.checked ? translateStyles[size] : 'translate-x-0'}
            `}
          />
        </div>
        {label && <span className="text-sm text-slate-600">{label}</span>}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
export default Toggle;
