import React, { useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { searchForms, getFormDetails, createEntryConfirm } from '../api';
import { toPersianNumber, formatJalaliDate, generateFormNumber, validateItemsCount, validateItem } from '../utils';
import AttachmentManager from '../components/AttachmentManager';

const EntryConfirmForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const [entryForm, setEntryForm] = useState({
    confirm_no: generateFormNumber('ENTRY'),
    purchase_date_shamsi: null,
    purchase_center: '',
    purchase_request_code: '',
    buyer_name: '',
    driver_name: '',
    reference_exit_form_no: '',
    reference_repair_form_no: '',
    items: [{ description: '', code: '', quantity: '', unit: 'عدد' }],
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: 'لطفاً شماره فرم را وارد کنید' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const results = await searchForms(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setMessage({ type: 'error', text: 'هیچ فرمی یافت نشد' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطا در جستجو' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = async (form) => {
    setLoading(true);
    try {
      const details = await getFormDetails(form.type, form.id);
      setSelectedForm(details);
      
      // Pre-fill entry form
      setEntryForm((prev) => ({
        ...prev,
        reference_exit_form_no: form.type === 'exit' ? form.number : details.reference_exit_form_no || '',
        reference_repair_form_no: form.type === 'repair' ? form.number : '',
      }));
      
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      setMessage({ type: 'error', text: 'خطا در بارگذاری جزئیات فرم' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setEntryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...entryForm.items];
    newItems[index][field] = value;
    setEntryForm((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    if (entryForm.items.length < 11) {
      setEntryForm((prev) => ({
        ...prev,
        items: [...prev.items, { description: '', code: '', quantity: '', unit: 'عدد' }],
      }));
    }
  };

  const removeItem = (index) => {
    if (entryForm.items.length > 1) {
      const newItems = entryForm.items.filter((_, i) => i !== index);
      setEntryForm((prev) => ({ ...prev, items: newItems }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    const itemsError = validateItemsCount(entryForm.items, 1, 11);
    if (itemsError) {
      setMessage({ type: 'error', text: itemsError });
      return;
    }

    for (const item of entryForm.items) {
      const itemError = validateItem(item);
      if (itemError) {
        setMessage({ type: 'error', text: itemError });
        return;
      }
    }

    try {
      const data = {
        ...entryForm,
        purchase_date_shamsi: entryForm.purchase_date_shamsi ? formatJalaliDate(entryForm.purchase_date_shamsi) : null,
      };

      const response = await createEntryConfirm(data);
      setMessage({ type: 'success', text: 'تأیید ورود با موفقیت ثبت شد' });
      
      // Reset form
      setEntryForm({
        confirm_no: generateFormNumber('ENTRY'),
        purchase_date_shamsi: null,
        purchase_center: '',
        purchase_request_code: '',
        buyer_name: '',
        driver_name: '',
        reference_exit_form_no: '',
        reference_repair_form_no: '',
        items: [{ description: '', code: '', quantity: '', unit: 'عدد' }],
      });
      setSelectedForm(null);
      addAttachmentTarget({
        entityType: 'entry_confirm',
        entityId: response.id,
        title: `پیوست‌های تأیید ورود ${toPersianNumber(response.confirm_no)}`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'خطا در ثبت تأیید ورود' });
    }
  };

  const unitOptions = ['عدد', 'حلقه', 'لاستیک', 'متر', 'کیلوگرم', 'لیتر', 'دستگاه'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ثبت تأیید ورود</h2>

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

        {/* Search Section */}
        {!selectedForm && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">جستجوی فرم خروج/تعمیر</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="شماره فرم خروج یا تعمیر را وارد کنید"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'در حال جستجو...' : 'جستجو'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">شماره فرم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.map((result, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {result.type === 'exit' ? 'فرم خروج' : 'فرم تعمیر'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{toPersianNumber(result.number)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{toPersianNumber(result.date_shamsi)}</td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${result.status === 'در حال ارسال' ? 'status-sending' : 'status-repairing'}`}>
                            {result.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSelectForm(result)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            انتخاب
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Selected Form Info */}
        {selectedForm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">فرم انتخاب شده</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <span className="font-medium">نوع:</span>{' '}
                    {selectedForm.form_no?.startsWith('EXIT') || !selectedForm.form_no?.startsWith('REPAIR') ? 'فرم خروج' : 'فرم تعمیر'}
                  </p>
                  <p>
                    <span className="font-medium">شماره:</span> {toPersianNumber(selectedForm.form_no)}
                  </p>
                  <p>
                    <span className="font-medium">تاریخ:</span> {toPersianNumber(selectedForm.date_shamsi)}
                  </p>
                  {selectedForm.reference_exit_form_no && (
                    <p>
                      <span className="font-medium">فرم خروج مرجع:</span> {toPersianNumber(selectedForm.reference_exit_form_no)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedForm(null);
                  setEntryForm({
                    ...entryForm,
                    reference_exit_form_no: '',
                    reference_repair_form_no: '',
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                تغییر فرم
              </button>
            </div>
          </div>
        )}

        {/* Entry Confirmation Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره تأیید <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={toPersianNumber(entryForm.confirm_no)}
                onChange={(e) => handleFormChange('confirm_no', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ خرید/بازگشت</label>
              <DatePicker
                value={entryForm.purchase_date_shamsi}
                onChange={(date) => handleFormChange('purchase_date_shamsi', date)}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                inputClass="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                containerClassName="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مرکز خرید</label>
              <input
                type="text"
                value={entryForm.purchase_center}
                onChange={(e) => handleFormChange('purchase_center', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">کد درخواست خرید</label>
              <input
                type="text"
                value={entryForm.purchase_request_code}
                onChange={(e) => handleFormChange('purchase_request_code', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام خریدار</label>
              <input
                type="text"
                value={entryForm.buyer_name}
                onChange={(e) => handleFormChange('buyer_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام راننده</label>
              <input
                type="text"
                value={entryForm.driver_name}
                onChange={(e) => handleFormChange('driver_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">شماره فرم خروج مرجع</label>
              <input
                type="text"
                value={toPersianNumber(entryForm.reference_exit_form_no)}
                onChange={(e) => handleFormChange('reference_exit_form_no', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">شماره فرم تعمیر مرجع</label>
              <input
                type="text"
                value={toPersianNumber(entryForm.reference_repair_form_no)}
                onChange={(e) => handleFormChange('reference_repair_form_no', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                اقلام (حداقل ۱، حداکثر ۱۱) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={entryForm.items.length >= 11}
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">کد کالا (اختیاری)</th>
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
                  {entryForm.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-700">{toPersianNumber(index + 1)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
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
                          onClick={() => removeItem(index)}
                          disabled={entryForm.items.length === 1}
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
              ذخیره تأیید ورود
            </button>
          </div>
        </form>
      </div>

      {attachmentTargets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">پیوست تأییدیه‌های ثبت‌شده</h3>
              <p className="text-sm text-gray-600">
                برای تکمیل مستندات، فایل‌های مربوط به تأیید ورود را بارگذاری و مدیریت کنید.
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

export default EntryConfirmForm;
