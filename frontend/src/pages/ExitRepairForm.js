import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import {
  createExitRequest,
  createFailureReport,
  createRepairOrder,
  fetchExitRequests,
  getEquipments,
} from '../api';
import {
  formatJalaliDate,
  generateFormNumber,
  getStatusClass,
  translateStatus,
  toPersianNumber,
  validateItem,
  validateItemsCount,
} from '../utils';

const defaultItem = () => ({ description: '', quantity: '', unit: 'عدد', code: '' });

const ExitRepairForm = () => {
  const [equipments, setEquipments] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [message, setMessage] = useState(null);

  const [failureForm, setFailureForm] = useState({
    equipment_id: '',
    failure_code: '',
    severity: 'medium',
    description: '',
  });

  const [exitForm, setExitForm] = useState({
    equipment_id: '',
    form_number: generateFormNumber('EXIT'),
    request_type: 'repair',
    reason: '',
    expected_return_at: null,
    payload: {
      driver_name: '',
      items: [defaultItem()],
    },
  });

  const [repairForm, setRepairForm] = useState({
    exit_request_id: '',
    form_number: generateFormNumber('REP'),
    started_at: null,
    completed_at: null,
    actions_note: '',
    materials_note: '',
    status: 'in_progress',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [equipmentList, exitRequests] = await Promise.all([
          getEquipments({ per_page: 50 }),
          fetchExitRequests({ per_page: 5 }),
        ]);
        const equipmentData = equipmentList?.data ?? equipmentList;
        setEquipments(equipmentData);
        const exitData = exitRequests?.data ?? exitRequests;
        setRecentRequests(exitData);
        if (equipmentData?.length) {
          const firstId = equipmentData[0]?.id;
          setFailureForm((prev) => ({ ...prev, equipment_id: firstId }));
          setExitForm((prev) => ({ ...prev, equipment_id: firstId }));
        }
        if (exitData?.length) {
          setRepairForm((prev) => ({ ...prev, exit_request_id: exitData[0].id }));
        }
      } catch (error) {
        console.error('init workflow error', error);
      }
    };
    init();
  }, []);

  const handleFailureSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await createFailureReport(failureForm);
      setMessage({ type: 'success', text: 'گزارش خرابی با موفقیت ثبت شد.' });
      setFailureForm((prev) => ({ ...prev, failure_code: '', description: '' }));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'ثبت گزارش خرابی ناموفق بود.' });
    }
  };

  const handleExitSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const itemsError = validateItemsCount(exitForm.payload.items, 1, 5);
    if (itemsError) {
      setMessage({ type: 'error', text: itemsError });
      return;
    }

    for (const item of exitForm.payload.items) {
      const itemError = validateItem(item);
      if (itemError) {
        setMessage({ type: 'error', text: itemError });
        return;
      }
    }

    try {
      const payload = {
        equipment_id: exitForm.equipment_id,
        form_number: exitForm.form_number,
        request_type: exitForm.request_type,
        reason: exitForm.reason,
        expected_return_at: exitForm.expected_return_at
          ? formatJalaliDate(exitForm.expected_return_at)
          : null,
        payload: exitForm.payload,
      };
      const response = await createExitRequest(payload);
      setMessage({ type: 'success', text: 'درخواست خروج با موفقیت ثبت شد.' });
      setExitForm({
        equipment_id: exitForm.equipment_id,
        form_number: generateFormNumber('EXIT'),
        request_type: 'repair',
        reason: '',
        expected_return_at: null,
        payload: { driver_name: '', items: [defaultItem()] },
      });
      setRecentRequests((prev) => [response, ...prev].slice(0, 5));
      setRepairForm((prev) => ({ ...prev, exit_request_id: response.id }));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'ثبت درخواست خروج ناموفق بود.' });
    }
  };

  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!repairForm.exit_request_id) {
      setMessage({ type: 'error', text: 'انتخاب درخواست خروج الزامی است.' });
      return;
    }

    try {
      const payload = {
        exit_request_id: repairForm.exit_request_id,
        form_number: repairForm.form_number,
        status: repairForm.status,
        started_at: repairForm.started_at ? formatJalaliDate(repairForm.started_at) : null,
        completed_at: repairForm.completed_at ? formatJalaliDate(repairForm.completed_at) : null,
        actions: repairForm.actions_note
          ? repairForm.actions_note.split('\n').filter(Boolean).map((item) => ({ description: item }))
          : [],
        materials: repairForm.materials_note
          ? repairForm.materials_note.split('\n').filter(Boolean).map((item) => ({ description: item }))
          : [],
      };
      await createRepairOrder(payload);
      setMessage({ type: 'success', text: 'گزارش تعمیر با موفقیت ذخیره شد.' });
      setRepairForm({
        exit_request_id: repairForm.exit_request_id,
        form_number: generateFormNumber('REP'),
        started_at: null,
        completed_at: null,
        actions_note: '',
        materials_note: '',
        status: 'completed',
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'ثبت تعمیر ناموفق بود.' });
    }
  };

  const selectedEquipment = useMemo(
    () => equipments.find((eq) => eq.id === exitForm.equipment_id) || {},
    [equipments, exitForm.equipment_id]
  );

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">گزارش خرابی</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleFailureSubmit}>
          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">تجهیز</label>
            <select
              value={failureForm.equipment_id}
              onChange={(e) => setFailureForm({ ...failureForm, equipment_id: Number(e.target.value) })}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">کد خرابی</label>
            <input
              value={failureForm.failure_code}
              onChange={(e) => setFailureForm({ ...failureForm, failure_code: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">شدت</label>
            <select
              value={failureForm.severity}
              onChange={(e) => setFailureForm({ ...failureForm, severity: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="low">کم</option>
              <option value="medium">متوسط</option>
              <option value="high">زیاد</option>
              <option value="critical">بحرانی</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">توضیحات</label>
            <textarea
              value={failureForm.description}
              onChange={(e) => setFailureForm({ ...failureForm, description: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ثبت گزارش خرابی
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">درخواست خروج تجهیز</h2>
        <form className="space-y-4" onSubmit={handleExitSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">تجهیز</label>
              <select
                value={exitForm.equipment_id}
                onChange={(e) => setExitForm({ ...exitForm, equipment_id: Number(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">شماره فرم</label>
              <input
                value={exitForm.form_number}
                onChange={(e) => setExitForm({ ...exitForm, form_number: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">نوع خروج</label>
              <select
                value={exitForm.request_type}
                onChange={(e) => setExitForm({ ...exitForm, request_type: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="repair">تعمیر</option>
                <option value="inspection">بازرسی</option>
                <option value="external">خارج از سایت</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">تاریخ بازگشت مورد انتظار</label>
              <DatePicker
                value={exitForm.expected_return_at}
                onChange={(value) => setExitForm({ ...exitForm, expected_return_at: value })}
                calendar={persian}
                locale={persian_fa}
                className="w-full"
                format="YYYY/MM/DD"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">راننده / مسئول</label>
              <input
                value={exitForm.payload.driver_name}
                onChange={(e) =>
                  setExitForm((prev) => ({
                    ...prev,
                    payload: { ...prev.payload, driver_name: e.target.value },
                  }))
                }
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">واحد درخواست کننده</label>
              <input
                value={selectedEquipment.unit?.name || ''}
                disabled
                className="w-full border rounded-lg px-4 py-2 bg-gray-100 dark:bg-slate-900/50 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">شرح خروج</label>
            <textarea
              value={exitForm.reason}
              onChange={(e) => setExitForm({ ...exitForm, reason: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">اقلام همراه</h3>
              <button
                type="button"
                onClick={() =>
                  setExitForm((prev) => ({
                    ...prev,
                    payload: {
                      ...prev.payload,
                      items: [...prev.payload.items, defaultItem()],
                    },
                  }))
                }
                className="text-sm text-blue-600 dark:text-blue-400"
              >
                افزودن قلم
              </button>
            </div>
            <div className="space-y-3">
              {exitForm.payload.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    placeholder="شرح"
                    value={item.description}
                    onChange={(e) => {
                      const items = [...exitForm.payload.items];
                      items[index].description = e.target.value;
                      setExitForm((prev) => ({ ...prev, payload: { ...prev.payload, items } }));
                    }}
                    className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  />
                  <input
                    placeholder="کد"
                    value={item.code}
                    onChange={(e) => {
                      const items = [...exitForm.payload.items];
                      items[index].code = e.target.value;
                      setExitForm((prev) => ({ ...prev, payload: { ...prev.payload, items } }));
                    }}
                    className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  />
                  <input
                    placeholder="تعداد"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const items = [...exitForm.payload.items];
                      items[index].quantity = e.target.value;
                      setExitForm((prev) => ({ ...prev, payload: { ...prev.payload, items } }));
                    }}
                    className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="واحد"
                      value={item.unit}
                      onChange={(e) => {
                        const items = [...exitForm.payload.items];
                        items[index].unit = e.target.value;
                        setExitForm((prev) => ({ ...prev, payload: { ...prev.payload, items } }));
                      }}
                      className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                    />
                    {exitForm.payload.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setExitForm((prev) => ({
                            ...prev,
                            payload: {
                              ...prev.payload,
                              items: prev.payload.items.filter((_, i) => i !== index),
                            },
                          }));
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              ثبت درخواست خروج
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">ثبت گزارش تعمیر</h2>
        <form className="space-y-4" onSubmit={handleRepairSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">درخواست خروج مرتبط</label>
              <select
                value={repairForm.exit_request_id}
                onChange={(e) => setRepairForm({ ...repairForm, exit_request_id: Number(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="">انتخاب کنید</option>
                {recentRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.form_number} - {req.equipment?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">شماره فرم تعمیر</label>
              <input
                value={repairForm.form_number}
                onChange={(e) => setRepairForm({ ...repairForm, form_number: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">تاریخ شروع</label>
              <DatePicker
                value={repairForm.started_at}
                onChange={(value) => setRepairForm({ ...repairForm, started_at: value })}
                calendar={persian}
                locale={persian_fa}
                className="w-full"
                format="YYYY/MM/DD"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">تاریخ پایان</label>
              <DatePicker
                value={repairForm.completed_at}
                onChange={(value) => setRepairForm({ ...repairForm, completed_at: value })}
                calendar={persian}
                locale={persian_fa}
                className="w-full"
                format="YYYY/MM/DD"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">اقدامات انجام شده (هر مورد در یک خط)</label>
              <textarea
                value={repairForm.actions_note}
                onChange={(e) => setRepairForm({ ...repairForm, actions_note: e.target.value })}
                rows={4}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">قطعات/مصرفی (هر مورد در یک خط)</label>
              <textarea
                value={repairForm.materials_note}
                onChange={(e) => setRepairForm({ ...repairForm, materials_note: e.target.value })}
                rows={4}
                className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              ثبت گزارش تعمیر
            </button>
          </div>
        </form>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">درخواست‌های اخیر</h2>
        {recentRequests.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-300 text-sm">درخواستی ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-right">شماره فرم</th>
                  <th className="px-4 py-2 text-right">تجهیز</th>
                  <th className="px-4 py-2 text-right">وضعیت</th>
                  <th className="px-4 py-2 text-right">بازگشت مورد انتظار</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-slate-100">
                      {toPersianNumber(req.form_number)}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-300">{req.equipment?.name}</td>
                    <td className="px-4 py-2">
                      <span className={`status-badge ${getStatusClass(req.status)}`}>
                        {translateStatus(req.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-300">
                      {req.expected_return_at ? toPersianNumber(req.expected_return_at) : '-'}
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

export default ExitRepairForm;
