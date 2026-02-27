import React from 'react';
import { Button } from './Button';

interface SnackbarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({ message, actionLabel, onAction }) => {
  return (
    <div className="snackbar">
      <span style={{ fontSize: 13 }}>{message}</span>
      {actionLabel && onAction && (
        <Button variant="ghost" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

