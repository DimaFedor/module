import React from 'react';
import { t } from '../../i18n/t';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination">
      <span>{t('pagination.pageOf', { page, totalPages })}</span>
      <button
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <IconChevronLeft size={14} />
        {t('pagination.prev')}
      </button>
      <button
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('pagination.next')}
        <IconChevronRight size={14} />
      </button>
    </div>
  );
};