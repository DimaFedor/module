import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...rest }) => {
  const inputId = id || React.useId();
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className={cn('form-input', className)} {...rest} />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

