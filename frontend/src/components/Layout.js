import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout } from '../api';

const roleLabels = {
  manager: 'مدیر',
  maintenance: 'تعمیرکار',
  storekeeper: 'انباردار',
  viewer: 'مشاهده‌گر',
};

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      logoutUser();
      navigate('/login');
    }
  };

  const navItems = useMemo(
    () => [
      { path: '/', label: 'داشبورد', icon: '🏠' },
      { path: '/exit-repair', label: 'گردش تعمیرات', icon: '🛠️' },
      { path: '/entry-confirm', label: 'تأیید ورود', icon: '📥' },
      { path: '/statuses', label: 'وضعیت و اعلان‌ها', icon: '📊' },
    ],
    []
  );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <header className="bg-white dark:bg-slate-800 shadow-md dark:shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              سامانه مدیریت تعمیرات معدن
            </h1>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              >
                {theme === 'dark' ? '☀️ تم روشن' : '🌙 تم تاریک'}
              </button>
              <div className="text-sm text-gray-700 dark:text-slate-200">
                <span className="font-medium">{user?.username}</span>
                <span className="mx-2">|</span>
                <span className="text-gray-500 dark:text-slate-300">{roleLabels[user?.role] || 'کاربر'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    isActive(item.path)
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-slate-300 dark:hover:text-white'
                  }
                `}
              >
                <span className="ml-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600 dark:text-slate-300">
            سامانه مدیریت تعمیرات معدن (CMMS) - نسخه ۱.۰.۰
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
