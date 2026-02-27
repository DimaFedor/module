import React from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { routes } from './routes';
import { useTheme } from '../theme/ThemeContext';
import { cn } from '../utils/cn';

// Sidebar is optimized for quick, low-cognitive-load navigation during stressful audits.

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

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-logo">Evidence Vault</div>
        <nav className="sidebar-nav">
          {routes.map((r) => (
            <Link
              key={r.path}
              to={r.path}
              className={cn(
                'sidebar-link',
                location.pathname === r.path && 'sidebar-link-active'
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="app-header">
          <div className="app-header-title">Compliance / Audit Evidence Vault</div>
          <div className="app-header-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
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

