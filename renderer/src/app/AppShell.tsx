import React from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { routes } from './routes';
import { useTheme } from '../theme/ThemeContext';
import { cn } from '../utils/cn';
import { t } from '../i18n/t';
import { navIcons, IconShield, IconSun, IconMoon } from '../components/icons/Icons';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (!meta) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/evidence/new');
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('#evidence-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const mainRoutes = routes.filter((r) => r.label && r.label !== 'nav.addEvidence');
  const actionRoutes = routes.filter((r) => r.label === 'nav.addEvidence');

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">
            <div className="sidebar-logo-icon">
              <IconShield size={18} color="#fff" />
            </div>
            <span>Audit Vault</span>
          </div>
          <div className="sidebar-logo-subtitle">Compliance Evidence System</div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Навігація</div>
          {mainRoutes.map((r) => {
            const Icon = navIcons[r.label!];
            return (
              <Link
                key={r.path}
                to={r.path}
                className={cn(
                  'sidebar-link',
                  location.pathname === r.path && 'sidebar-link-active'
                )}
              >
                {Icon && <Icon size={18} />}
                {r.label ? t(r.label as any) : ''}
              </Link>
            );
          })}
          <div className="sidebar-section-label">Дії</div>
          {actionRoutes.map((r) => {
            const Icon = navIcons[r.label!];
            return (
              <Link
                key={r.path}
                to={r.path}
                className={cn(
                  'sidebar-link',
                  location.pathname === r.path && 'sidebar-link-active'
                )}
              >
                {Icon && <Icon size={18} />}
                {r.label ? t(r.label as any) : ''}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="app-header">
          <div className="app-header-title">{t('app.title')}</div>
          <div className="app-header-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            >
              {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
          </div>
        </header>
        <main className="app-content">
          <div className="app-content-inner">
            <Routes>
              {routes.map((r) => (
                <Route key={r.path} path={r.path} element={<r.component />} />
              ))}
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};