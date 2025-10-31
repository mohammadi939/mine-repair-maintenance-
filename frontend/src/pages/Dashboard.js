import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard, fetchFailureReports, fetchNotifications } from '../api';
import { getStatusClass, translateStatus, toPersianNumber } from '../utils';

const StatCard = ({ title, value, icon, accent }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <span className="text-3xl">{icon}</span>
      <span className={`text-sm font-medium ${accent}`}>{title}</span>
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{toPersianNumber(value)}</div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [failures, setFailures] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:8000/api', []);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, failuresData, notificationsData] = await Promise.all([
          fetchDashboard(),
          fetchFailureReports({ per_page: 5 }),
          fetchNotifications({ status: 'pending' }),
        ]);
        const extract = (payload) => payload?.data ?? payload?.data?.data ?? payload ?? [];
        setStats(dashboardData);
        setFailures(extract(failuresData));
        setDelays(extract(notificationsData));
      } catch (error) {
        console.error('Dashboard load error', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center text-gray-600 dark:text-slate-200">
        در حال بارگذاری داشبورد...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard title="کل تجهیزات" value={stats?.stats?.equipment_total || 0} icon="⛏️" accent="text-blue-500" />
        <StatCard title="خرابی‌های باز" value={stats?.stats?.failures_open || 0} icon="🚨" accent="text-red-500" />
        <StatCard title="درخواست خروج معلق" value={stats?.stats?.exit_pending || 0} icon="📤" accent="text-orange-500" />
        <StatCard title="تعمیرات جاری" value={stats?.stats?.repair_in_progress || 0} icon="🛠️" accent="text-emerald-500" />
        <StatCard title="اعلان تأخیر" value={stats?.stats?.delays || 0} icon="⏱️" accent="text-purple-500" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">آخرین خرابی‌های ثبت شده</h2>
            <Link to="/exit-repair" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ثبت خرابی جدید
            </Link>
          </div>
          {failures.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 text-sm">خرابی ثبت شده‌ای وجود ندارد.</p>
          ) : (
            <ul className="space-y-3">
              {failures.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{item.equipment?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">{item.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>شدت: {item.severity}</span>
                      <span>کد: {item.failure_code}</span>
                      <span>وضعیت: {translateStatus(item.status)}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                    {translateStatus(item.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">اعلان‌های تاخیر</h2>
            <Link to="/statuses" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              مشاهده همه اعلان‌ها
            </Link>
          </div>
          {delays.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 text-sm">تاخیری ثبت نشده است.</p>
          ) : (
            <ul className="space-y-3">
              {delays.slice(0, 5).map((delay) => (
                <li key={delay.id} className="rounded-lg bg-orange-50 dark:bg-orange-500/10 p-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">{delay.message}</p>
                  <div className="mt-2 text-xs text-orange-600 dark:text-orange-200 flex gap-4">
                    <span>دستگاه: {delay.equipment?.name}</span>
                    {delay.expected_at && <span>تاریخ مورد انتظار: {toPersianNumber(delay.expected_at)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">گزارش عملکرد</h2>
          <div className="flex gap-3 text-sm">
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => window.open(`${apiBase}/reports/failures/pdf`, '_blank')}
            >
              گزارش خرابی PDF
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => window.open(`${apiBase}/reports/repairs/excel`, '_blank')}
            >
              تعمیرات Excel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-slate-300">
          {stats?.monthlyFailures?.length ? (
            stats.monthlyFailures.map((item) => (
              <div key={item.day} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <span>{toPersianNumber(item.day)}</span>
                <span className="font-semibold text-gray-900 dark:text-slate-100">{toPersianNumber(item.total)}</span>
              </div>
            ))
          ) : (
            <p>داده‌ای برای این ماه ثبت نشده است.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
