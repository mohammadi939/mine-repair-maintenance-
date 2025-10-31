import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import {
  createReEntryApproval,
  fetchRepairOrders,
  fetchReEntryApprovals,
} from '../api';
import {
  formatJalaliDate,
  generateFormNumber,
  getStatusClass,
  toPersianNumber,
  translateStatus,
} from '../utils';

const EntryConfirmForm = () => {
  const [repairOrders, setRepairOrders] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all' });

  const [form, setForm] = useState({
    repair_order_id: '',
    form_number: generateFormNumber('ENT'),
    approved_at: null,
    inspection_notes: '',
    safety_note: '',
    status: 'approved',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [repairs, entries] = await Promise.all([
          fetchRepairOrders({ status: 'completed', per_page: 20 }),
          fetchReEntryApprovals({ per_page: 10 }),
        ]);
        const repairData = repairs?.data ?? repairs;
        setRepairOrders(repairData);
        if (repairData?.length) {
          setForm((prev) => ({ ...prev, repair_order_id: repairData[0].id }));
        }
        const entryData = entries?.data ?? entries;
        setApprovals(entryData);
      } catch (error) {
        console.error('load approvals', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!form.repair_order_id) {
      setMessage({ type: 'error', text: 'انتخاب دستور تعمیر الزامی است.' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        repair_order_id: form.repair_order_id,
        form_number: form.form_number,
        inspection_notes: form.inspection_notes,
        status: form.status,
        approved_at: form.approved_at ? formatJalaliDate(form.approved_at) : null,
        safety_checks: form.safety_note
          ? form.safety_note.split('\n').filter(Boolean).map((item) => ({ title: item }))
          : [],
      };
      const approval = await createReEntryApproval(payload);
      setMessage({ type: 'success', text: 'تأیید ورود با موفقیت ثبت شد.' });
      setForm({
        repair_order_id: form.repair_order_id,
        form_number: generateFormNumber('ENT'),
        approved_at: null,
        inspection_notes: '',
        safety_note: '',
        status: 'approved',
      });
      setApprovals((prev) => [approval, ...prev].slice(0, 10));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطا در ثبت تأیید ورود رخ داد.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredApprovals = useMemo(() => {
    if (filters.status === 'all') return approvals;
    return approvals.filter((item) => item.status === filters.status);
  }, [approvals, filters.status]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">ثبت تأیید ورود تجهیز</h2>
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">دستور تعمیر</label>
              <select
                value={form.repair_order_id}
                onChange={(e) => setForm({ ...form, repair_order_id: Number(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="">انتخاب کنید</option>
                {repairOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.form_number} - {order.exit_request?.equipment?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">شماره فرم تأیید</label>
              <input
                value={form.form_number}
                onChange={(e) => setForm({ ...form, form_number: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">تاریخ تأیید</label>
              <DatePicker
                value={form.approved_at}
                onChange={(value) => setForm({ ...form, approved_at: value })}
                calendar={persian}
                locale={persian_fa}
                className="w-full"
                format="YYYY/MM/DD"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">وضعیت</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="approved">تایید شده</option>
                <option value="rejected">رد شده</option>
                <option value="pending">در انتظار</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">نتیجه بازرسی</label>
            <textarea
              value={form.inspection_notes}
              onChange={(e) => setForm({ ...form, inspection_notes: e.target.value })}
              rows={4}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">چک لیست ایمنی (هر آیتم در یک خط)</label>
            <textarea
              value={form.safety_note}
              onChange={(e) => setForm({ ...form, safety_note: e.target.value })}
              rows={4}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'در حال ثبت...' : 'ثبت تأیید ورود'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">سوابق تأیید ورود</h2>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 text-sm"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="approved">تایید شده</option>
            <option value="pending">در انتظار</option>
            <option value="rejected">رد شده</option>
          </select>
        </div>

        {filteredApprovals.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-300 text-sm">تأییدیه‌ای یافت نشد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-right">شماره فرم</th>
                  <th className="px-4 py-2 text-right">تجهیز</th>
                  <th className="px-4 py-2 text-right">وضعیت</th>
                  <th className="px-4 py-2 text-right">تاریخ</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredApprovals.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-slate-100">
                      {toPersianNumber(item.form_number)}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-300">
                      {item.repair_order?.exit_request?.equipment?.name}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {translateStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-300">
                      {item.approved_at ? toPersianNumber(item.approved_at) : '-'}
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

export default EntryConfirmForm;
