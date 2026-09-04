

import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <label
        htmlFor={checkboxId}
        className="flex items-center gap-2.5 cursor-pointer select-none"
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={`
            w-4 h-4 rounded border-slate-300 text-blue-600
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
            cursor-pointer
            ${className}
          `}
          {...props}
        />
        {label && <span className="text-sm text-slate-600">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
