import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout } from '../api';

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const navItems = [
    { path: '/', label: 'داشبورد', icon: '🏠' },
    { path: '/exit-repair', label: 'خروج/تعمیر', icon: '📤' },
    { path: '/entry-confirm', label: 'تأیید ورود', icon: '📥' },
    { path: '/statuses', label: 'وضعیت‌ها', icon: '📊' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                سامانه مدیریت تعمیرات معدن
              </h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.username}</span>
                <span className="mx-2">|</span>
                <span className="text-gray-500">
                  {user?.role === 'manager' && 'مدیر'}
                  {user?.role === 'storekeeper' && 'انباردار'}
                  {user?.role === 'unit' && 'واحد'}
                  {user?.role === 'workshop' && 'کارگاه'}
                </span>
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

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    isActive(item.path)
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            سامانه مدیریت تعمیرات معدن (CMMS) - نسخه ۱.۰.۰
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
