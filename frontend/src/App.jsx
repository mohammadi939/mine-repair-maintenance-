import React, { useEffect, useMemo, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { createClient } from './hooks/useApi';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import BackupPanel from './components/BackupPanel';
import ToastContainerPortal from './components/Toast';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

const themeStorageKey = 'cmms-theme';

function App() {
  const [token, setToken] = useState(localStorage.getItem('cmms-token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('cmms-user');
    return raw ? JSON.parse(raw) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem(themeStorageKey) || 'dark');

  const api = useMemo(() => (token ? createClient(token) : null), [token]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const handleLogin = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem('cmms-token', payload.token);
    localStorage.setItem('cmms-user', JSON.stringify(payload.user));
  };

  const handleLogout = async () => {
    if (!api) return;
    try {
      await api.delete('/auth.php');
    } catch (error) {
      console.warn(error.message);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('cmms-token');
    localStorage.removeItem('cmms-user');
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Login onSuccess={handleLogin} />
        <ToastContainerPortal />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-mining-dark text-slate-900 dark:text-slate-200">
        <header className="bg-white dark:bg-slate-900 shadow-md border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-mining-accent">سامانه مدیریت تعمیرات معدن</span>
              <span className="text-sm text-slate-500 dark:text-slate-300">{user.username} ({user.role})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100"
                title="تغییر حالت روشن/تاریک"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                خروج
              </button>
            </div>
          </div>
          <nav className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 py-2 flex gap-4 text-sm">
              <Link to="/" className="hover:text-mining-accent">فرم‌ها و درخواست‌ها</Link>
              <Link to="/reports" className="hover:text-mining-accent">گزارش‌ها</Link>
              {user.role === 'admin' && <Link to="/backup" className="hover:text-mining-accent">پشتیبان‌گیری</Link>}
            </div>
          </nav>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard api={api} user={user} />} />
            <Route path="/reports" element={<Reports api={api} />} />
            <Route
              path="/backup"
              element={user.role === 'admin' ? <BackupPanel api={api} /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} واحد تعمیرات معدن - تمامی حقوق محفوظ است.
        </footer>
        <ToastContainerPortal />
      </div>
    </Router>
  );
}

export default App;
