import React from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className, id, children, ...rest }) => {
  const selectId = id || React.useId();
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className={cn('form-select', className)} {...rest}>
        {children}
      </select>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

