import React from 'react';
import { cn } from '../../utils/cn';
import { IconAlertTriangle, IconCheck } from '../icons/Icons';

interface CalloutProps {
  type?: 'error' | 'info' | 'success';
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type = 'info', children }) => {
  return (
    <div className={cn(
      'callout',
      type === 'error' && 'callout-error',
      type === 'success' && 'callout-success',
      type === 'info' && 'callout-info',
    )}>
      {type === 'error' && <IconAlertTriangle size={16} />}
      {type === 'success' && <IconCheck size={16} />}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};