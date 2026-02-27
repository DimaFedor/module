import React from 'react';
import { cn } from '../../utils/cn';
import type { EvidenceStatus } from '../../types/ipc';

interface BadgeProps {
  status: EvidenceStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  return (
    <span
      className={cn(
        'badge',
        status === 'draft' && 'badge-status-draft',
        status === 'submitted' && 'badge-status-submitted',
        status === 'approved' && 'badge-status-approved'
      )}
    >
      {status}
    </span>
  );
};

