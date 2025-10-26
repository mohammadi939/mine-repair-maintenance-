import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentForms } from '../api';
import { useAuth } from '../AuthContext';
import { toPersianNumber, getFormTypeLabel, getStatusClass } from '../utils';

const Dashboard = () => {
  const [recentForms, setRecentForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRecentForms();
  }, []);

  const loadRecentForms = async () => {
    try {
      const data = await getRecentForms(10);
      setRecentForms(data);
    } catch (err) {
      console.error('Error loading recent forms:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          خوش آمدید، {user?.username}
        </h2>
        <p className="text-gray-600">
          به سامانه مدیریت تعمیرات معدن خوش آمدید. از منوی بالا می‌توانید به بخش‌های مختلف دسترسی داشته باشید.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/exit-repair"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">📤</div>
          <h3 className="text-xl font-bold mb-2">ثبت خروج/تعمیر</h3>
          <p className="text-blue-100">ثبت فرم درخواست خروج و تعمیرات</p>
        </Link>

        <Link
          to="/entry-confirm"
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">📥</div>
          <h3 className="text-xl font-bold mb-2">تأیید ورود</h3>
          <p className="text-green-100">ثبت تأیید ورود پس از تعمیر</p>
        </Link>

        <Link
          to="/statuses"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-xl font-bold mb-2">مشاهده وضعیت‌ها</h3>
          <p className="text-purple-100">نمای کلی از تمام فرم‌ها</p>
        </Link>
      </div>

      {/* Recent Forms */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">فرم‌های اخیر</h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
        ) : recentForms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">هیچ فرمی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره فرم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentForms.map((form, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getFormTypeLabel(form.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {toPersianNumber(form.number)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {toPersianNumber(form.date_shamsi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getStatusClass(form.status)}`}>
                        {form.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
