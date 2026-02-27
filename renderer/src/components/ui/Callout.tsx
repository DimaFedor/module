import React from 'react';
import { cn } from '../../utils/cn';

interface CalloutProps {
  type?: 'error' | 'info';
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type = 'info', children }) => {
  return (
    <div className={cn('callout', type === 'error' && 'callout-error')}>
      {children}
    </div>
  );
}

