import React from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className, id, ...rest }) => {
  const textareaId = id || React.useId();
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea id={textareaId} className={cn('form-textarea', className)} rows={4} {...rest} />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

