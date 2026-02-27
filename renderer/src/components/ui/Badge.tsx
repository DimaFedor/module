import React from 'react';
import { cn } from '../../utils/cn';
import type { EvidenceStatus } from '../../types/ipc';
import { t } from '../../i18n/t';

interface BadgeProps {
  status: EvidenceStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const labelKey =
    status === 'draft'
      ? 'status.draft'
      : status === 'submitted'
      ? 'status.submitted'
      : 'status.approved';

  return (
    <span
      className={cn(
        'badge',
        status === 'draft' && 'badge-status-draft',
        status === 'submitted' && 'badge-status-submitted',
        status === 'approved' && 'badge-status-approved'
      )}
    >
      {t(labelKey as any)}
    </span>
  );
};

