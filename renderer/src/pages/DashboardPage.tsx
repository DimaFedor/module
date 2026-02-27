import React from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n/t';

export const DashboardPage: React.FC = () => {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0, marginBottom: 12 }}>{t('dashboard.title')}</h1>
      <p style={{ marginBottom: 16, fontSize: 14 }}>{t('dashboard.subtitle')}</p>
      <ul style={{ fontSize: 14, paddingLeft: 18 }}>
        <li>
          {t('dashboard.goVault')} <Link to="/vault">{t('nav.vault')}</Link>.
        </li>
        <li>
          {t('dashboard.goAuditLog')} <Link to="/audit-log">{t('nav.auditLog')}</Link>.
        </li>
        <li>
          {t('dashboard.goExport')} <Link to="/export">{t('nav.export')}</Link>.
        </li>
      </ul>
    </div>
  );
};

