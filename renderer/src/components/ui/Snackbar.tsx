import React from 'react';
import { IconCheck } from '../icons/Icons';

interface SnackbarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({ message, actionLabel, onAction }) => {
  return (
    <div className="snackbar">
      <IconCheck size={16} color="var(--color-success)" />
      <span>{message}</span>
      {actionLabel && onAction && (
        <button className="snackbar-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};