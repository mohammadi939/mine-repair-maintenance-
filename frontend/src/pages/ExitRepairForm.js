import React, { useState, useEffect } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { createExitForm, createRepairForm, getUnits, getRecentForms } from '../api';
import { toPersianNumber, formatJalaliDate, generateFormNumber, validateItemsCount, validateItem } from '../utils';
import AttachmentManager from '../components/AttachmentManager';

const ExitRepairForm = () => {
  const [units, setUnits] = useState([]);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [lastExitFormNo, setLastExitFormNo] = useState('');
  const [recentForms, setRecentForms] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [attachmentTargets, setAttachmentTargets] = useState([]);

  const addAttachmentTarget = (target) => {
    setAttachmentTargets((prev) => {
      const exists = prev.some(
        (item) => item.entityType === target.entityType && item.entityId === target.entityId,
      );
      if (exists) {
        return prev;
      }
      return [...prev, target];
    });
  };

  const removeAttachmentTarget = (entityType, entityId) => {
    setAttachmentTargets((prev) =>
      prev.filter((item) => !(item.entityType === entityType && item.entityId === entityId)),
    );
  };

  // Exit form state
  const [exitForm, setExitForm] = useState({
    form_no: generateFormNumber('EXIT'),
    date_shamsi: null,
    out_type: '',
    driver_name: '',
    reason: '',
    unit_id: '',
    items: [{ description: '', code: '', quantity: '', unit: 'عدد' }],
  });

  // Repair form state
  const [repairForm, setRepairForm] = useState({
    form_no: generateFormNumber('REPAIR'),
    date_shamsi: null,
    description: '',
    reference_exit_form_no: '',
    unit_id: '',
    items: [],
  });

  useEffect(() => {
    loadUnits();
    loadRecentForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
      if (data.length > 0 && !exitForm.unit_id) {
        setExitForm((prev) => ({ ...prev, unit_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading units:', err);
    }
  };

  const loadRecentForms = async () => {
    try {
      const data = await getRecentForms(5);
      setRecentForms(data);
    } catch (err) {
      console.error('Error loading recent forms:', err);
    }
  };

  // Exit form handlers
  const handleExitFormChange = (field, value) => {
    setExitForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleExitItemChange = (index, field, value) => {
    const newItems = [...exitForm.items];
    newItems[index][field] = value;
    setExitForm((prev) => ({ ...prev, items: newItems }));
  };

  const addExitItem = () => {
    if (exitForm.items.length < 5) {
      setExitForm((prev) => ({
        ...prev,
        items: [...prev.items, { description: '', code: '', quantity: '', unit: 'عدد' }],
      }));
    }
  };

  const removeExitItem = (index) => {
    if (exitForm.items.length > 1) {
      const newItems = exitForm.items.filter((_, i) => i !== index);
      setExitForm((prev) => ({ ...prev, items: newItems }));
    }
  };

  const handleExitFormSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    const itemsError = validateItemsCount(exitForm.items, 1, 5);
    if (itemsError) {
      setMessage({ type: 'error', text: itemsError });
      return;
    }

    for (const item of exitForm.items) {
      const itemError = validateItem(item);
      if (itemError) {
        setMessage({ type: 'error', text: itemError });
        return;
      }
    }

    if (!exitForm.date_shamsi) {
      setMessage({ type: 'error', text: 'تاریخ الزامی است' });
      return;
    }

    try {
      const data = {
        ...exitForm,
        date_shamsi: formatJalaliDate(exitForm.date_shamsi),
      };

      const response = await createExitForm(data);
      setMessage({ type: 'success', text: 'فرم خروج با موفقیت ثبت شد' });
      setLastExitFormNo(response.form_no);
      setShowRepairForm(true);
      setRepairForm((prev) => ({
        ...prev,
        reference_exit_form_no: response.form_no,
        unit_id: exitForm.unit_id,
      }));
      loadRecentForms();
      addAttachmentTarget({
        entityType: 'exit_form',
        entityId: response.id,
        title: `پیوست‌های فرم خروج ${toPersianNumber(response.form_no)}`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'خطا در ثبت فرم خروج' });
    }
  };

  // Repair form handlers
  const handleRepairFormChange = (field, value) => {
    setRepairForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRepairItemChange = (index, field, value) => {
    const newItems = [...repairForm.items];
    newItems[index][field] = value;
    setRepairForm((prev) => ({ ...prev, items: newItems }));
  };

  const addRepairItem = () => {
    setRepairForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', code: '', quantity: '', unit: 'عدد' }],
    }));
  };

  const removeRepairItem = (index) => {
    const newItems = repairForm.items.filter((_, i) => i !== index);
    setRepairForm((prev) => ({ ...prev, items: newItems }));
  };

  const handleRepairFormSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!repairForm.date_shamsi) {
      setMessage({ type: 'error', text: 'تاریخ الزامی است' });
      return;
    }

    // Validate items if provided
    if (repairForm.items.length > 0) {
      for (const item of repairForm.items) {
        const itemError = validateItem(item);
        if (itemError) {
          setMessage({ type: 'error', text: itemError });
          return;
        }
      }
    }

    try {
      const data = {
        ...repairForm,
        date_shamsi: formatJalaliDate(repairForm.date_shamsi),
      };

      const response = await createRepairForm(data);
      setMessage({ type: 'success', text: 'فرم تعمیر با موفقیت ثبت شد' });
      
      // Reset forms
      setExitForm({
        form_no: generateFormNumber('EXIT'),
        date_shamsi: null,
        out_type: '',
        driver_name: '',
        reason: '',
        unit_id: units[0]?.id || '',
        items: [{ description: '', code: '', quantity: '', unit: 'عدد' }],
      });
      setRepairForm({
        form_no: generateFormNumber('REPAIR'),
        date_shamsi: null,
        description: '',
        reference_exit_form_no: '',
        unit_id: '',
        items: [],
      });
      setShowRepairForm(false);
      loadRecentForms();
      addAttachmentTarget({
        entityType: 'repair_form',
        entityId: response.id,
        title: `پیوست‌های فرم تعمیر ${toPersianNumber(response.form_no)}`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'خطا در ثبت فرم تعمیر' });
    }
  };

  const unitOptions = ['عدد', 'حلقه', 'لاستیک', 'متر', 'کیلوگرم', 'لیتر', 'دستگاه'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ثبت فرم خروج و تعمیر</h2>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Exit Form */}
        {!showRepairForm && (
          <form onSubmit={handleExitFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره فرم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={toPersianNumber(exitForm.form_no)}
                  onChange={(e) => handleExitFormChange('form_no', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاریخ <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={exitForm.date_shamsi}
                  onChange={(date) => handleExitFormChange('date_shamsi', date)}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  inputClass="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  containerClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">واحد</label>
                <select
                  value={exitForm.unit_id}
                  onChange={(e) => handleExitFormChange('unit_id', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع خروج</label>
                <input
                  type="text"
                  value={exitForm.out_type}
                  onChange={(e) => handleExitFormChange('out_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام راننده</label>
                <input
                  type="text"
                  value={exitForm.driver_name}
                  onChange={(e) => handleExitFormChange('driver_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">دلیل خروج</label>
                <input
                  type="text"
                  value={exitForm.reason}
                  onChange={(e) => handleExitFormChange('reason', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  اقلام (حداقل ۱، حداکثر ۵) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addExitItem}
                  disabled={exitForm.items.length >= 5}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  + افزودن ردیف
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-8">#</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        شرح کالا <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">کد کالا</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        تعداد <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        واحد <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exitForm.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-700">{toPersianNumber(index + 1)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleExitItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleExitItemChange(index, 'code', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleExitItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleExitItemChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            {unitOptions.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeExitItem(index)}
                            disabled={exitForm.items.length === 1}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                ذخیره و ادامه به فرم تعمیر
              </button>
            </div>
          </form>
        )}

        {/* Repair Form */}
        {showRepairForm && (
          <form onSubmit={handleRepairFormSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <p className="text-blue-800">
                <span className="font-medium">فرم خروج ثبت شد.</span> شماره فرم: {toPersianNumber(lastExitFormNo)}
              </p>
              <p className="text-blue-700 text-sm mt-1">اکنون فرم تعمیر را تکمیل کنید.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره فرم تعمیر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={toPersianNumber(repairForm.form_no)}
                  onChange={(e) => handleRepairFormChange('form_no', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاریخ <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={repairForm.date_shamsi}
                  onChange={(date) => handleRepairFormChange('date_shamsi', date)}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  inputClass="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  containerClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شماره فرم خروج مرجع</label>
                <input
                  type="text"
                  value={toPersianNumber(repairForm.reference_exit_form_no)}
                  onChange={(e) => handleRepairFormChange('reference_exit_form_no', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شرح مشکل</label>
                <input
                  type="text"
                  value={repairForm.description}
                  onChange={(e) => handleRepairFormChange('description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Optional items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">اقلام (اختیاری)</label>
                <button
                  type="button"
                  onClick={addRepairItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + افزودن ردیف
                </button>
              </div>

              {repairForm.items.length > 0 && (
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-8">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">شرح کالا</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">کد کالا</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تعداد</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">واحد</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {repairForm.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-700">{toPersianNumber(index + 1)}</td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleRepairItemChange(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) => handleRepairItemChange(index, 'code', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleRepairItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.unit}
                              onChange={(e) => handleRepairItemChange(index, 'unit', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              {unitOptions.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeRepairItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowRepairForm(false);
                  setExitForm({
                    form_no: generateFormNumber('EXIT'),
                    date_shamsi: null,
                    out_type: '',
                    driver_name: '',
                    reason: '',
                    unit_id: units[0]?.id || '',
                    items: [{ description: '', code: '', quantity: '', unit: 'عدد' }],
                  });
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                بازگشت به فرم خروج
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                ذخیره فرم تعمیر
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Forms */}
      {!showRepairForm && recentForms.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">فرم‌های اخیر</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentForms.map((form, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {form.type === 'exit' ? 'خروج' : 'تعمیر'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{toPersianNumber(form.number)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{toPersianNumber(form.date_shamsi)}</td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${form.status === 'در حال ارسال' ? 'status-sending' : 'status-repairing'}`}>
                        {form.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {attachmentTargets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">پیوست فرم‌های ثبت‌شده</h3>
              <p className="text-sm text-gray-600">
                فایل‌های مرتبط با فرم‌های اخیر را بارگذاری کنید تا تیم‌های مجاز بتوانند آن‌ها را مشاهده کنند.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAttachmentTargets([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              پاکسازی لیست
            </button>
          </div>

          <div className="space-y-4">
            {attachmentTargets.map((target) => (
              <AttachmentManager
                key={`${target.entityType}-${target.entityId}`}
                entityType={target.entityType}
                entityId={target.entityId}
                title={target.title}
                onRemove={() => removeAttachmentTarget(target.entityType, target.entityId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitRepairForm;
