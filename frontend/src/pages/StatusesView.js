import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchFailureReports,
  fetchExitRequests,
  fetchRepairOrders,
  fetchNotifications,
  fetchTimeline,
  getEquipments,
  markNotificationSent,
} from '../api';
import { getStatusClass, getFormTypeLabel, toPersianNumber, translateStatus } from '../utils';

const StatusesView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', status: 'all' });
  const [error, setError] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);

  const extractArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [failures, exits, repairs, notifications, equipmentResponse] = await Promise.all([
          fetchFailureReports({ per_page: 10 }),
          fetchExitRequests({ per_page: 10 }),
          fetchRepairOrders({ per_page: 10 }),
          fetchNotifications({ per_page: 10 }),
          getEquipments({ per_page: 100 }),
        ]);
        const failureItems = (failures?.data ?? failures).map((item) => ({
          id: `failure-${item.id}`,
          type: 'failure',
          form_no: item.failure_code,
          title: item.equipment?.name,
          status: item.status,
          date: item.reported_at,
          meta: `شدت: ${item.severity}`,
        }));
        const exitItems = (exits?.data ?? exits).map((item) => ({
          id: `exit-${item.id}`,
          type: 'exit',
          form_no: item.form_number,
          title: item.equipment?.name,
          status: item.status,
          date: item.created_at,
          meta: item.reason,
        }));
        const repairItems = (repairs?.data ?? repairs).map((item) => ({
          id: `repair-${item.id}`,
          type: 'repair',
          form_no: item.form_number,
          title: item.exit_request?.equipment?.name,
          status: item.status,
          date: item.completed_at || item.started_at,
          meta: item.actions?.length ? `${item.actions.length} اقدام` : '',
        }));
        const notificationItems = (notifications?.data ?? notifications).map((item) => ({
          id: `notification-${item.id}`,
          type: 'notification',
          form_no: item.id,
          title: item.equipment?.name,
          status: item.status,
          date: item.expected_at,
          meta: item.message,
          raw: item,
        }));
        setRecords([...failureItems, ...exitItems, ...repairItems, ...notificationItems]);
        const equipmentList = extractArray(equipmentResponse?.data ?? equipmentResponse);
        setEquipments(equipmentList);
        if (!selectedEquipment && equipmentList.length) {
          setSelectedEquipment(Number(equipmentList[0].id));
        }
      } catch (err) {
        setError('خطا در بارگذاری وضعیت‌ها');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!selectedEquipment) {
        setTimelineEvents([]);
        return;
      }
      try {
        setTimelineLoading(true);
        setTimelineError(null);
        const response = await fetchTimeline(selectedEquipment, { per_page: 20 });
        const events = extractArray(response?.data ?? response);
        setTimelineEvents(events);
      } catch (err) {
        setTimelineError('خطا در بارگذاری تایم‌لاین');
        console.error('timeline load error', err);
      } finally {
        setTimelineLoading(false);
      }
    };
    loadTimeline();
  }, [selectedEquipment]);

  const selectedEquipmentName = useMemo(() => {
    if (selectedEquipment === '' || selectedEquipment === null) {
      return 'انتخاب نشده';
    }
    return equipments.find((item) => item.id === Number(selectedEquipment))?.name || 'انتخاب نشده';
  }, [equipments, selectedEquipment]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filters.type !== 'all' && record.type !== filters.type) return false;
      if (filters.status !== 'all' && record.status !== filters.status) return false;
      return true;
    });
  }, [records, filters]);

  const handleMarkSent = async (record) => {
    try {
      await markNotificationSent(record.raw.id);
      setRecords((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? { ...item, status: 'sent', meta: 'ارسال شد', raw: { ...item.raw, status: 'sent' } }
            : item
        )
      );
    } catch (err) {
      console.error('mark notification error', err);
    }
  };

  const contextLabels = {
    severity: 'شدت',
    report_id: 'کد گزارش',
    exit_request_id: 'درخواست خروج',
    repair_order_id: 'سفارش تعمیر',
    reentry_approval_id: 'تایید ورود',
    status: 'وضعیت',
  };

  const renderContextValue = (key, value) => {
    if (key === 'status') {
      return translateStatus(value);
    }
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'number') {
      return toPersianNumber(value);
    }
    if (typeof value === 'string') {
      return toPersianNumber(value);
    }
    return JSON.stringify(value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">پایش وضعیت و اعلان‌ها</h2>
          <div className="flex gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 text-sm"
            >
              <option value="all">همه انواع</option>
              <option value="failure">گزارش خرابی</option>
              <option value="exit">درخواست خروج</option>
              <option value="repair">سفارش تعمیر</option>
              <option value="notification">اعلان تأخیر</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 text-sm"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending">در انتظار</option>
              <option value="approved">تایید شده</option>
              <option value="rejected">رد شده</option>
              <option value="in_progress">در حال انجام</option>
              <option value="completed">تکمیل شده</option>
              <option value="sent">ارسال شده</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500 dark:text-slate-300">در حال بارگذاری اطلاعات...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-gray-500 dark:text-slate-300">رکوردی مطابق فیلتر یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-right">نوع</th>
                  <th className="px-4 py-2 text-right">شناسه/شماره</th>
                  <th className="px-4 py-2 text-right">عنوان</th>
                  <th className="px-4 py-2 text-right">وضعیت</th>
                  <th className="px-4 py-2 text-right">تاریخ</th>
                  <th className="px-4 py-2 text-right">توضیحات</th>
                  <th className="px-4 py-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-2 text-gray-700 dark:text-slate-300">{getFormTypeLabel(record.type)}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-slate-100">
                      {toPersianNumber(record.form_no)}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-slate-300">{record.title}</td>
                    <td className="px-4 py-2">
                      <span className={`status-badge ${getStatusClass(record.status)}`}>
                        {translateStatus(record.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-300">
                      {record.date ? toPersianNumber(record.date) : '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-300">{record.meta || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      {record.type === 'notification' && record.status !== 'sent' ? (
                        <button
                          onClick={() => handleMarkSent(record)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs"
                        >
                          علامت به عنوان ارسال شده
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">تایم‌لاین وضعیت تجهیزات</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              نمایش رویدادهای ثبت شده برای تجهیز انتخاب شده ({selectedEquipmentName})
            </p>
          </div>
          <select
            value={selectedEquipment}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedEquipment(value ? Number(value) : '');
            }}
            className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 text-sm"
          >
            <option value="">انتخاب تجهیز</option>
            {equipments.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.name}
              </option>
            ))}
          </select>
        </div>

        {timelineLoading ? (
          <div className="text-gray-500 dark:text-slate-300">در حال بارگذاری رویدادها...</div>
        ) : timelineError ? (
          <div className="text-red-600">{timelineError}</div>
        ) : !selectedEquipment ? (
          <div className="text-gray-500 dark:text-slate-300 text-sm">لطفاً تجهیزی را برای مشاهده تایم‌لاین انتخاب کنید.</div>
        ) : timelineEvents.length === 0 ? (
          <div className="text-gray-500 dark:text-slate-300 text-sm">رویدادی برای این تجهیز ثبت نشده است.</div>
        ) : (
          <div className="relative pr-4 border-r-2 border-blue-100 dark:border-slate-700 space-y-6">
            {timelineEvents.map((event) => (
              <div key={event.id} className="relative pr-6">
                <span className="absolute -right-3 top-3 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 bg-blue-500"></span>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-800 dark:text-slate-100">{event.title}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {event.occurred_at ? toPersianNumber(new Date(event.occurred_at).toLocaleString('fa-IR')) : '-'}
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">{event.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {event.event_type}
                    </span>
                    {event.user?.name && <span>ثبت توسط: {event.user.name}</span>}
                    {event.context &&
                      Object.entries(event.context)
                        .filter(([, value]) => value !== null && value !== '')
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 rounded-full bg-white/60 dark:bg-slate-800/60"
                          >
                            {contextLabels[key] || key}: {renderContextValue(key, value)}
                          </span>
                        ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusesView;
