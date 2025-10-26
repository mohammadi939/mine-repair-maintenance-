import React, { useState, useEffect } from 'react';
import { getAllStatuses } from '../api';
import { toPersianNumber, getFormTypeLabel, getStatusClass } from '../utils';

const StatusesView = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const data = await getAllStatuses();
      setStatuses(data);
    } catch (err) {
      console.error('Error loading statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStatuses = statuses.filter((status) => {
    if (filterType !== 'all' && status.type !== filterType) return false;
    if (filterStatus !== 'all' && status.status !== filterStatus) return false;
    return true;
  });

  const statusOptions = [
    { value: 'all', label: 'همه' },
    { value: 'در حال ارسال', label: 'در حال ارسال' },
    { value: 'در حال تعمیر', label: 'در حال تعمیر' },
    { value: 'تعمیر شده', label: 'تعمیر شده' },
    { value: 'تحویل به معدن', label: 'تحویل به معدن' },
  ];

  const typeOptions = [
    { value: 'all', label: 'همه' },
    { value: 'exit', label: 'فرم خروج' },
    { value: 'repair', label: 'فرم تعمیر' },
    { value: 'entry', label: 'تأیید ورود' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">وضعیت‌ها</h2>
          <button
            onClick={loadStatuses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            بروزرسانی
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فیلتر بر اساس نوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فیلتر بر اساس وضعیت</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">راهنمای رنگ‌ها</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="status-badge status-sending">در حال ارسال</span>
              <span className="text-sm text-gray-600">- ارسال شده برای تعمیر</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-badge status-repairing">در حال تعمیر</span>
              <span className="text-sm text-gray-600">- در حال تعمیر</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-badge status-repaired">تعمیر شده</span>
              <span className="text-sm text-gray-600">- تعمیر تکمیل شده</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-badge status-delivered">تحویل به معدن</span>
              <span className="text-sm text-gray-600">- تحویل داده شده</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-badge status-unknown">نامعلوم</span>
              <span className="text-sm text-gray-600">- وضعیت نامشخص</span>
            </div>
          </div>
        </div>

        {/* Statuses Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">در حال بارگذاری...</div>
        ) : filteredStatuses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">هیچ فرمی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع فرم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره فرم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">واحد</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مراجع</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStatuses.map((status, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {getFormTypeLabel(status.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {toPersianNumber(status.form_no)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {status.date_shamsi ? toPersianNumber(status.date_shamsi) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {status.unit_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getStatusClass(status.status)}`}>
                        {status.status || 'نامعلوم'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {status.reference_exit_form_no && (
                        <div className="text-xs">
                          خروج: {toPersianNumber(status.reference_exit_form_no)}
                        </div>
                      )}
                      {status.reference_repair_form_no && (
                        <div className="text-xs">
                          تعمیر: {toPersianNumber(status.reference_repair_form_no)}
                        </div>
                      )}
                      {!status.reference_exit_form_no && !status.reference_repair_form_no && '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {toPersianNumber(filteredStatuses.length)}
              </div>
              <div className="text-sm text-gray-600 mt-1">کل فرم‌ها</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {toPersianNumber(
                  filteredStatuses.filter((s) => s.status === 'در حال ارسال').length
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">در حال ارسال</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {toPersianNumber(
                  filteredStatuses.filter((s) => s.status === 'در حال تعمیر').length
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">در حال تعمیر</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {toPersianNumber(
                  filteredStatuses.filter((s) => s.status === 'تعمیر شده').length
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">تعمیر شده</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {toPersianNumber(
                  filteredStatuses.filter((s) => s.status === 'تحویل به معدن').length
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">تحویل به معدن</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusesView;
