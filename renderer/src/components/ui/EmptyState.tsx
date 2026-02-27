import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {description && <p style={{ fontSize: 14 }}>{description}</p>}
      {actionLabel && onAction && (
        <div style={{ marginTop: 16 }}>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

