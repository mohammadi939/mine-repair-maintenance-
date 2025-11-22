import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { formatJalaliDate, generateFormNumber, getStatusClass, toPersianNumber } from '../utils';

const emptyItem = () => ({ description: '', code: '', quantity: 1, unit: 'عدد' });

const defaultData = {
  units: [
    { id: 1, name: 'واحد حفاری' },
    { id: 2, name: 'واحد حمل و نقل' },
    { id: 3, name: 'واحد تأسیسات' },
  ],
  devices: [
    { id: 1, name: 'بیل مکانیکی PC-400', code: 'EQ-401', unit_id: 1 },
    { id: 2, name: 'دامپتراک 50 تنی', code: 'EQ-210', unit_id: 2 },
    { id: 3, name: 'پمپ هیدرولیک', code: 'EQ-901', unit_id: 3 },
  ],
  repairers: [
    { id: 1, name: 'تعمیرگاه مرکزی', contact: 'آقای رضایی', phone: '09120000000' },
    { id: 2, name: 'پیمانکار کاوه', contact: 'خانم احمدی', phone: '09123334444' },
  ],
  exits: [],
  repairs: [],
  entries: [],
};

const persistKey = 'local-cmms-flow';

const statusLabels = {
  sending: 'در حال ارسال',
  repairing: 'در حال تعمیر',
  returned: 'تحویل به معدن',
};

const LocalWorkflow = () => {
  const [data, setData] = useState(defaultData);
  const [exitForm, setExitForm] = useState({
    date: null,
    priority: 'normal',
    unit_id: 1,
    device_id: 1,
    exit_type: 'تعمیرات',
    driver: '',
    issue: '',
    items: [emptyItem()],
    form_number: generateFormNumber('EX-'),
  });

  const [repairForm, setRepairForm] = useState({
    date: null,
    unit_id: 1,
    repairer_id: 1,
    notes: '',
    items: [emptyItem()],
    exit_id: '',
    form_number: generateFormNumber('RP-'),
  });

  const [entryForm, setEntryForm] = useState({
    date: null,
    buyer: '',
    purchase_code: '',
    driver: '',
    notes: '',
    items: [emptyItem()],
    repair_id: '',
    form_number: generateFormNumber('EN-'),
  });

  const [alert, setAlert] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(persistKey);
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(persistKey, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const devices = data.devices.filter((d) => d.unit_id === exitForm.unit_id);
    if (devices.length) {
      setExitForm((prev) => ({ ...prev, device_id: devices[0].id }));
    }
  }, [data.devices, exitForm.unit_id]);

  const saveExit = (e) => {
    e.preventDefault();
    if (!exitForm.date || !exitForm.driver || !exitForm.issue) {
      setAlert({ type: 'error', text: 'تاریخ، راننده و شرح مشکل را وارد کنید.' });
      return;
    }
    const payload = {
      ...exitForm,
      id: data.exits.length + 1,
      status: 'sending',
      items: exitForm.items.filter((item) => item.description.trim()),
    };
    setData((prev) => ({ ...prev, exits: [payload, ...prev.exits] }));
    setAlert({ type: 'success', text: 'فرم خروج ثبت شد.' });
    setExitForm({
      ...exitForm,
      date: null,
      driver: '',
      issue: '',
      items: [emptyItem()],
      form_number: generateFormNumber('EX-'),
    });
  };

  const saveRepair = (e) => {
    e.preventDefault();
    if (!repairForm.exit_id) {
      setAlert({ type: 'error', text: 'ابتدا فرم خروج مرتبط را انتخاب کنید.' });
      return;
    }
    if (!repairForm.date || !repairForm.notes) {
      setAlert({ type: 'error', text: 'تاریخ ارجاع و شرح خدمات الزامی است.' });
      return;
    }
    const payload = {
      ...repairForm,
      id: data.repairs.length + 1,
      status: 'repairing',
      items: repairForm.items.filter((item) => item.description.trim()),
    };
    setData((prev) => ({ ...prev, repairs: [payload, ...prev.repairs] }));
    setAlert({ type: 'success', text: 'فرم ارجاع به تعمیرگاه ثبت شد.' });
    setRepairForm({
      ...repairForm,
      date: null,
      notes: '',
      items: [emptyItem()],
      form_number: generateFormNumber('RP-'),
    });
  };

  const saveEntry = (e) => {
    e.preventDefault();
    if (!entryForm.repair_id) {
      setAlert({ type: 'error', text: 'سفارش تعمیر مرتبط را انتخاب کنید.' });
      return;
    }
    if (!entryForm.date) {
      setAlert({ type: 'error', text: 'تاریخ ورود الزامی است.' });
      return;
    }
    const payload = {
      ...entryForm,
      id: data.entries.length + 1,
      status: 'returned',
      items: entryForm.items.filter((item) => item.description.trim()),
    };
    setData((prev) => ({ ...prev, entries: [payload, ...prev.entries] }));
    setAlert({ type: 'success', text: 'تأیید ورود ثبت شد.' });
    setEntryForm({
      ...entryForm,
      date: null,
      buyer: '',
      purchase_code: '',
      driver: '',
      notes: '',
      items: [emptyItem()],
      form_number: generateFormNumber('EN-'),
    });
  };

  const devicesForUnit = useMemo(
    () => data.devices.filter((d) => d.unit_id === exitForm.unit_id),
    [data.devices, exitForm.unit_id]
  );

  const combinedRows = useMemo(() => {
    return data.exits.map((exit) => {
      const repair = data.repairs.find((r) => r.exit_id === exit.id);
      const entry = data.entries.find((en) => en.repair_id === repair?.id);
      const unit = data.units.find((u) => u.id === exit.unit_id);
      const device = data.devices.find((d) => d.id === exit.device_id);
      const status = entry?.status || repair?.status || exit.status;
      const statusClass = getStatusClass(status);
      const formNo = repair ? `${exit.form_number} / ${repair.form_number}` : exit.form_number;
      return { exit, repair, entry, unit, device, status, statusClass, formNo };
    });
  }, [data]);

  const activeTimeline = useMemo(() => {
    if (!selectedProcess) return [];
    const exit = data.exits.find((e) => e.id === selectedProcess);
    if (!exit) return [];
    const repair = data.repairs.find((r) => r.exit_id === exit.id);
    const entry = repair ? data.entries.find((en) => en.repair_id === repair.id) : null;
    const items = [];
    items.push({
      type: 'exit',
      title: 'خروج از معدن',
      date: formatJalaliDate(exit.date),
      form: exit.form_number,
      desc: exit.issue,
    });
    if (repair) {
      items.push({
        type: 'repair',
        title: 'ارجاع به تعمیرگاه',
        date: formatJalaliDate(repair.date),
        form: repair.form_number,
        desc: repair.notes,
      });
    }
    if (entry) {
      items.push({
        type: 'entry',
        title: 'تأیید ورود',
        date: formatJalaliDate(entry.date),
        form: entry.form_number,
        desc: entry.notes,
      });
    }
    return items;
  }, [selectedProcess, data]);

  const updateItems = (items, idx, key, value, setter) => {
    const newItems = items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
    setter(newItems);
  };

  const addItemRow = (setter) => setter((prev) => [...prev, emptyItem()]);
  const removeItemRow = (setter, idx) => setter((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">گردش کامل آفلاین</h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            نمونه ساده برای ثبت فرم‌های خروج، تعمیر و ورود بدون نیاز به سرور
          </p>
        </div>
        {alert && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {alert.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exit form */}
          <form onSubmit={saveExit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">۱) فرم خروج از معدن</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">تاریخ</label>
                <DatePicker
                  value={exitForm.date}
                  onChange={(value) => setExitForm({ ...exitForm, date: value })}
                  calendar={persian}
                  locale={persian_fa}
                  className="w-full"
                  format="YYYY/MM/DD"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">واحد</label>
                  <select
                    value={exitForm.unit_id}
                    onChange={(e) => setExitForm({ ...exitForm, unit_id: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  >
                    {data.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">دستگاه</label>
                  <select
                    value={exitForm.device_id}
                    onChange={(e) => setExitForm({ ...exitForm, device_id: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  >
                    {devicesForUnit.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">فوریت</label>
                  <select
                    value={exitForm.priority}
                    onChange={(e) => setExitForm({ ...exitForm, priority: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">نوع خروج</label>
                  <select
                    value={exitForm.exit_type}
                    onChange={(e) => setExitForm({ ...exitForm, exit_type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="تعمیرات">تعمیرات</option>
                    <option value="خدمات">خدمات</option>
                    <option value="سرویس دوره‌ای">سرویس دوره‌ای</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">نام راننده</label>
                <input
                  value={exitForm.driver}
                  onChange={(e) => setExitForm({ ...exitForm, driver: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="نام راننده..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">شرح مشکل</label>
                <textarea
                  value={exitForm.issue}
                  onChange={(e) => setExitForm({ ...exitForm, issue: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="شرح خرابی یا دلیل خروج"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-slate-300">اقلام همراه</label>
                  <button
                    type="button"
                    onClick={() => addItemRow((items) => setExitForm({ ...exitForm, items }))}
                    className="text-blue-600 text-sm"
                  >
                    + افزودن قلم
                  </button>
                </div>
                {exitForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      className="col-span-4 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      placeholder="شرح"
                      value={item.description}
                      onChange={(e) =>
                        updateItems(exitForm.items, idx, 'description', e.target.value, (items) =>
                          setExitForm({ ...exitForm, items })
                        )
                      }
                    />
                    <input
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      placeholder="کد"
                      value={item.code}
                      onChange={(e) =>
                        updateItems(exitForm.items, idx, 'code', e.target.value, (items) =>
                          setExitForm({ ...exitForm, items })
                        )
                      }
                    />
                    <input
                      type="number"
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItems(exitForm.items, idx, 'quantity', Number(e.target.value), (items) =>
                          setExitForm({ ...exitForm, items })
                        )
                      }
                    />
                    <input
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      value={item.unit}
                      onChange={(e) =>
                        updateItems(exitForm.items, idx, 'unit', e.target.value, (items) =>
                          setExitForm({ ...exitForm, items })
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow((items) => setExitForm({ ...exitForm, items }), idx)}
                      className="col-span-2 text-red-600 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500">شماره فرم: {exitForm.form_number}</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ثبت خروج
                </button>
              </div>
            </div>
          </form>

          {/* Repair form */}
          <form onSubmit={saveRepair} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">۲) ارجاع به تعمیرگاه</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">انتخاب فرم خروج</label>
                <select
                  value={repairForm.exit_id}
                  onChange={(e) => setRepairForm({ ...repairForm, exit_id: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="">انتخاب کنید</option>
                  {data.exits.map((exit) => (
                    <option key={exit.id} value={exit.id}>
                      {exit.form_number} - {data.devices.find((d) => d.id === exit.device_id)?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">تاریخ ارجاع</label>
                  <DatePicker
                    value={repairForm.date}
                    onChange={(value) => setRepairForm({ ...repairForm, date: value })}
                    calendar={persian}
                    locale={persian_fa}
                    className="w-full"
                    format="YYYY/MM/DD"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">تعمیرگاه</label>
                  <select
                    value={repairForm.repairer_id}
                    onChange={(e) => setRepairForm({ ...repairForm, repairer_id: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  >
                    {data.repairers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">شرح خدمات یا خرابی</label>
                <textarea
                  value={repairForm.notes}
                  onChange={(e) => setRepairForm({ ...repairForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="شرح دقیق مشکل برای تعمیرکار"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-slate-300">اقلام ارسال‌شده</label>
                  <button
                    type="button"
                    onClick={() => addItemRow((items) => setRepairForm({ ...repairForm, items }))}
                    className="text-blue-600 text-sm"
                  >
                    + افزودن قلم
                  </button>
                </div>
                {repairForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      className="col-span-4 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      placeholder="شرح"
                      value={item.description}
                      onChange={(e) =>
                        updateItems(repairForm.items, idx, 'description', e.target.value, (items) =>
                          setRepairForm({ ...repairForm, items })
                        )
                      }
                    />
                    <input
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      placeholder="کد"
                      value={item.code}
                      onChange={(e) =>
                        updateItems(repairForm.items, idx, 'code', e.target.value, (items) =>
                          setRepairForm({ ...repairForm, items })
                        )
                      }
                    />
                    <input
                      type="number"
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItems(repairForm.items, idx, 'quantity', Number(e.target.value), (items) =>
                          setRepairForm({ ...repairForm, items })
                        )
                      }
                    />
                    <input
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      value={item.unit}
                      onChange={(e) =>
                        updateItems(repairForm.items, idx, 'unit', e.target.value, (items) =>
                          setRepairForm({ ...repairForm, items })
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow((items) => setRepairForm({ ...repairForm, items }), idx)}
                      className="col-span-2 text-red-600 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500">شماره فرم: {repairForm.form_number}</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  ثبت ارجاع
                </button>
              </div>
            </div>
          </form>

          {/* Entry form */}
          <form onSubmit={saveEntry} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">۳) تأیید ورود به معدن</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">انتخاب سفارش تعمیر</label>
                <select
                  value={entryForm.repair_id}
                  onChange={(e) => setEntryForm({ ...entryForm, repair_id: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="">انتخاب کنید</option>
                  {data.repairs.map((rep) => {
                    const exit = data.exits.find((ex) => ex.id === rep.exit_id);
                    const device = data.devices.find((d) => d.id === exit?.device_id);
                    return (
                      <option key={rep.id} value={rep.id}>
                        {rep.form_number} - {device?.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">تاریخ ورود</label>
                <DatePicker
                  value={entryForm.date}
                  onChange={(value) => setEntryForm({ ...entryForm, date: value })}
                  calendar={persian}
                  locale={persian_fa}
                  className="w-full"
                  format="YYYY/MM/DD"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">مرکز خرید / خریدار</label>
                  <input
                    value={entryForm.buyer}
                    onChange={(e) => setEntryForm({ ...entryForm, buyer: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                    placeholder="نام مسئول خرید"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300">کد درخواست خرید</label>
                  <input
                    value={entryForm.purchase_code}
                    onChange={(e) => setEntryForm({ ...entryForm, purchase_code: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                    placeholder="کد یا شماره سفارش"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">راننده تحویل‌دهنده</label>
                <input
                  value={entryForm.driver}
                  onChange={(e) => setEntryForm({ ...entryForm, driver: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="نام راننده"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-slate-300">شرح/یادداشت</label>
                <textarea
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="شرح پذیرش یا ایرادات باقی‌مانده"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-slate-300">اقلام ورود</label>
                  <button
                    type="button"
                    onClick={() => addItemRow((items) => setEntryForm({ ...entryForm, items }))}
                    className="text-blue-600 text-sm"
                  >
                    + افزودن قلم
                  </button>
                </div>
                {entryForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      className="col-span-4 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      placeholder="شرح"
                      value={item.description}
                      onChange={(e) =>
                        updateItems(entryForm.items, idx, 'description', e.target.value, (items) =>
                          setEntryForm({ ...entryForm, items })
                        )
                      }
                    />
                    <input
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      placeholder="کد"
                      value={item.code}
                      onChange={(e) =>
                        updateItems(entryForm.items, idx, 'code', e.target.value, (items) =>
                          setEntryForm({ ...entryForm, items })
                        )
                      }
                    />
                    <input
                      type="number"
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItems(entryForm.items, idx, 'quantity', Number(e.target.value), (items) =>
                          setEntryForm({ ...entryForm, items })
                        )
                      }
                    />
                    <input
                      className="col-span-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
                      value={item.unit}
                      onChange={(e) =>
                        updateItems(entryForm.items, idx, 'unit', e.target.value, (items) =>
                          setEntryForm({ ...entryForm, items })
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow((items) => setEntryForm({ ...entryForm, items }), idx)}
                      className="col-span-2 text-red-600 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500">شماره فرم: {entryForm.form_number}</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  ثبت ورود
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Status table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">مرور وضعیت‌ها</h3>
          <span className="text-sm text-gray-500">
            برای مشاهده تایم‌لاین روی هر ردیف کلیک کنید
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره فرم</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">واحد</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">دستگاه</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">شرح مختصر</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {combinedRows.map((row) => (
                <tr
                  key={row.exit.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => setSelectedProcess(row.exit.id)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">{row.formNo}</td>
                  <td className="px-4 py-3 text-sm">{row.unit?.name}</td>
                  <td className="px-4 py-3 text-sm">{row.device?.name}</td>
                  <td className="px-4 py-3 text-sm">{formatJalaliDate(row.exit.date)}</td>
                  <td className="px-4 py-3 text-sm">{row.exit.issue}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`${row.statusClass} inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold`}>
                      {statusLabels[row.status] || row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {combinedRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">
                    هنوز فرآیندی ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">تایم‌لاین فرآیند</h3>
          <span className="text-sm text-gray-500">فرآیند انتخاب‌شده: {selectedProcess ? `#${toPersianNumber(selectedProcess)}` : 'انتخاب نشده'}</span>
        </div>
        {activeTimeline.length === 0 ? (
          <p className="text-sm text-gray-500">ردیفی را از جدول بالا انتخاب کنید.</p>
        ) : (
          <ol className="relative border-r border-gray-200 dark:border-slate-700 pr-6">
            {activeTimeline.map((item, idx) => (
              <li key={idx} className="mb-8 ml-4">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -right-1.5 border border-white dark:border-slate-800" />
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                      {idx + 1}. {item.title}
                    </span>
                    <span className="text-xs text-gray-500">{item.form}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">تاریخ: {item.date}</p>
                  <p className="text-sm text-gray-700 dark:text-slate-200">{item.desc || '-'}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Quick reference */}
      <div className="bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 p-4 text-sm text-blue-900 dark:text-slate-200">
        <h4 className="font-semibold mb-2">راهنمای سریع</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>همه داده‌ها فقط در مرورگر ذخیره می‌شوند و نیاز به سرور یا دیتابیس ندارند.</li>
          <li>برای هر مرحله یک شماره فرم یکتا تولید می‌شود و در جدول وضعیت‌ها نمایش داده می‌شود.</li>
          <li>ردیف جدول را انتخاب کنید تا تایم‌لاین سه‌مرحله‌ای همان فرآیند نمایش داده شود.</li>
        </ul>
      </div>
    </div>
  );
};

export default LocalWorkflow;
