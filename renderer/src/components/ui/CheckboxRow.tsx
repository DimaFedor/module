import React from 'react';

interface CheckboxRowProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const CheckboxRow: React.FC<CheckboxRowProps> = ({ label, ...rest }) => {
  const id = React.useId();
  return (
    <label className="checkbox-row" htmlFor={id}>
      <input id={id} type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
};

