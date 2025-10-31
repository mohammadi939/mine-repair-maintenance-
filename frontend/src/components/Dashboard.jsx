import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ShamsiDatePicker from './ShamsiDatePicker';
import TimelineModal from './TimelineModal';
import QRView from './QRView';
import { PlusCircleIcon, EyeIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { API_BASE } from '../hooks/useApi';

const statusPalette = {
  'ارسال به تعمیرگاه': 'bg-blue-500/10 text-blue-700 dark:text-blue-200',
  'در حال تعمیر': 'bg-orange-500/10 text-orange-600 dark:text-orange-200',
  'تعمیر شده': 'bg-green-500/10 text-green-600 dark:text-green-200',
  'غیر قابل تعمیر': 'bg-red-500/10 text-red-600 dark:text-red-200',
  'صرفه اقتصادی ندارد': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-200',
  'داغی': 'bg-purple-500/10 text-purple-600 dark:text-purple-200',
  'نامعلوم': 'bg-gray-500/10 text-gray-600 dark:text-gray-200',
};

const statuses = Object.keys(statusPalette);
const typeLabels = {
  exit: 'خروج از معدن',
  external: 'تعمیر بیرونی',
  confirm: 'تأیید ورود',
};

const defaultItem = () => ({
  name: '',
  serial: '',
  status: statuses[0],
  quantity: 1,
  unit: 'عدد',
  note: '',
  beforeImages: [],
  afterImages: [],
});

const emptyForm = (type) => ({
  type,
  request_number: '',
  requester_unit_id: '',
  workshop_id: '',
  description: '',
  date_shamsi: '',
  confirm_date_shamsi: '',
  items: [defaultItem()],
});

const Dashboard = ({ api, user }) => {
  const [tab, setTab] = useState('exit');
  const [forms, setForms] = useState({
    exit: emptyForm('exit'),
    external: emptyForm('external'),
    confirm: emptyForm('confirm'),
  });
  const [units, setUnits] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [note, setNote] = useState('');
  const [itemDrafts, setItemDrafts] = useState([]);

  const currentForm = useMemo(() => forms[tab], [forms, tab]);
  const assetBase = useMemo(() => {
    const base = API_BASE.replace(/\/?api$/, '/');
    return base.endsWith('/') ? base : `${base}/`;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [unitsRes, workshopRes, inventoryRes, requestsRes] = await Promise.all([
          api.get('/units.php'),
          api.get('/workshops.php'),
          api.get('/inventory.php'),
          api.get('/requests.php'),
        ]);
        setUnits(unitsRes.data.units || []);
        setWorkshops(workshopRes.data.workshops || []);
        setInventory(inventoryRes.data.inventory || []);
        setRequests(requestsRes.data.requests || []);
      } catch (error) {
        toast.error(error.message);
      }
    };
    if (api) load();
  }, [api]);

  const resetForm = (type) => {
    setForms((prev) => ({ ...prev, [type]: emptyForm(type) }));
  };

  const updateForm = (type, payload) => {
    setForms((prev) => ({ ...prev, [type]: { ...prev[type], ...payload } }));
  };

  const handleItemChange = (type, index, field, value) => {
    setForms((prev) => {
      const updated = prev[type].items.map((item, idx) => {
        if (idx !== index) return item;
        const next = { ...item, [field]: value };
        if (field === 'name') {
          const match = inventory.find((inv) => inv.name === value);
          if (match) {
            next.serial = match.serial || next.serial;
          }
        }
        return next;
      });
      return { ...prev, [type]: { ...prev[type], items: updated } };
    });
  };

  const handleAddItem = (type) => {
    setForms((prev) => {
      if (prev[type].items.length >= 5) {
        toast.warn('حداکثر ۵ قلم مجاز است.');
        return prev;
      }
      return {
        ...prev,
        [type]: { ...prev[type], items: [...prev[type].items, defaultItem()] },
      };
    });
  };

  const handleRemoveItem = (type, index) => {
    setForms((prev) => {
      const items = prev[type].items.filter((_, idx) => idx !== index);
      if (items.length === 0) {
        toast.warn('حداقل یک قلم باید ثبت شود.');
        return prev;
      }
      return { ...prev, [type]: { ...prev[type], items } };
    });
  };

  const handleCreate = async (type) => {
    const form = forms[type];
    if (!form.request_number || !form.requester_unit_id || !form.date_shamsi) {
      toast.error('اطلاعات اصلی فرم تکمیل نشده است.');
      return;
    }
    try {
      const response = await api.post('/requests.php', form);
      toast.success('درخواست ثبت شد.');
      resetForm(type);
      fetchRequests();
      if (response.data?.request_id) {
        await selectRequest(response.data.request_id);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests.php');
      setRequests(response.data.requests || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const selectRequest = async (id) => {
    try {
      const response = await api.get(`/requests.php?action=show&id=${id}`);
      const request = response.data.request;
      setSelectedRequest(request);
      setItemDrafts(request.items);
      localStorage.setItem('cmms-selected-request', JSON.stringify(request));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTimeline = async (id, index) => {
    try {
      const response = await api.get(`/history.php?request_id=${id}${index !== undefined ? `&item_index=${index}` : ''}`);
      setTimeline(response.data.history || []);
      setTimelineOpen(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpload = async (requestId, itemIndex, file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('request_id', requestId);
      formData.append('item_index', itemIndex);
      formData.append('type', type);
      await api.post('/upload.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('فایل بارگذاری شد.');
      await selectRequest(requestId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;
    try {
      await api.put('/requests.php', {
        id: selectedRequest.id,
        items: itemDrafts,
        status: itemDrafts[0]?.status || selectedRequest.status,
        note,
      });
      toast.success('به‌روزرسانی انجام شد.');
      setNote('');
      await selectRequest(selectedRequest.id);
      await fetchRequests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleQuickAddUnit = async () => {
    const name = prompt('نام واحد جدید را وارد کنید');
    if (!name) return;
    try {
      await api.post('/units.php', { name });
      const refreshed = await api.get('/units.php');
      setUnits(refreshed.data.units || []);
      toast.success('واحد جدید ثبت شد.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleQuickAddWorkshop = async () => {
    const name = prompt('نام کارگاه جدید را وارد کنید');
    if (!name) return;
    try {
      await api.post('/workshops.php', { name });
      const refreshed = await api.get('/workshops.php');
      setWorkshops(refreshed.data.workshops || []);
      toast.success('کارگاه جدید ثبت شد.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleQuickAddInventory = async () => {
    const name = prompt('شرح تجهیز جدید');
    if (!name) return;
    const serial = prompt('شماره سریال (اختیاری)') || '';
    try {
      await api.post('/inventory.php', { name, serial, unit_id: user.unit_id });
      const refreshed = await api.get('/inventory.php');
      setInventory(refreshed.data.inventory || []);
      toast.success('تجهیز جدید اضافه شد.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { key: 'exit', label: 'درخواست خروج از معدن' },
            { key: 'external', label: 'ارسال به تعمیرگاه بیرونی' },
            { key: 'confirm', label: 'تأیید ورود پس از تعمیر' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm ${
                tab === t.key ? 'bg-mining-accent text-white' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <datalist id="inventory-list">
            {inventory.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
          <div className="space-y-3">
            <label className="text-sm">شماره فرم</label>
            <input
              type="text"
              value={currentForm.request_number}
              onChange={(e) => updateForm(tab, { request_number: e.target.value })}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm">واحد درخواست‌کننده</label>
              <button onClick={handleQuickAddUnit} className="text-xs text-mining-accent">افزودن سریع</button>
            </div>
            <select
              value={currentForm.requester_unit_id}
              onChange={(e) => updateForm(tab, { requester_unit_id: e.target.value })}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
            >
              <option value="">انتخاب واحد</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm">کارگاه / مقصد</label>
              <button onClick={handleQuickAddWorkshop} className="text-xs text-mining-accent">افزودن سریع</button>
            </div>
            <select
              value={currentForm.workshop_id}
              onChange={(e) => updateForm(tab, { workshop_id: e.target.value })}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
            >
              <option value="">انتخاب کارگاه</option>
              {workshops.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ShamsiDatePicker
              value={currentForm.date_shamsi}
              onChange={(value) => updateForm(tab, { date_shamsi: value })}
              label="تاریخ درخواست"
            />
            {tab === 'confirm' && (
              <ShamsiDatePicker
                value={currentForm.confirm_date_shamsi}
                onChange={(value) => updateForm(tab, { confirm_date_shamsi: value })}
                label="تاریخ ورود"
              />
            )}
            <label className="text-sm">توضیحات</label>
            <textarea
              value={currentForm.description}
              onChange={(e) => updateForm(tab, { description: e.target.value })}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">اقلام درخواست</h3>
              <button onClick={() => handleAddItem(tab)} className="text-mining-accent text-sm flex items-center gap-1">
                <PlusCircleIcon className="w-4 h-4" /> افزودن ردیف
              </button>
            </div>
            <div className="space-y-3">
              {currentForm.items.map((item, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>ردیف {index + 1}</span>
                    <button onClick={() => handleRemoveItem(tab, index)} className="text-red-500 flex items-center gap-1 text-xs">
                      ✕ حذف
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      list="inventory-list"
                      type="text"
                      placeholder="شرح تجهیز"
                      value={item.name}
                      onChange={(e) => handleItemChange(tab, index, 'name', e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2"
                    />
                    <button onClick={handleQuickAddInventory} className="text-xs text-mining-accent flex items-center gap-1">
                      <PlusCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="شماره سریال"
                    value={item.serial}
                    onChange={(e) => handleItemChange(tab, index, 'serial', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                  />
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <select
                      value={item.status}
                      onChange={(e) => handleItemChange(tab, index, 'status', e.target.value)}
                      className="border border-slate-300 rounded-md px-2 py-1"
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(tab, index, 'quantity', Number(e.target.value))}
                      className="border border-slate-300 rounded-md px-2 py-1"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(tab, index, 'unit', e.target.value)}
                      className="border border-slate-300 rounded-md px-2 py-1"
                    />
                  </div>
                  <textarea
                    placeholder="توضیحات"
                    value={item.note}
                    onChange={(e) => handleItemChange(tab, index, 'note', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => handleCreate(tab)}
              className="w-full bg-mining-accent text-white py-2 rounded-md flex items-center justify-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" /> ثبت فرم
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-mining-accent">درخواست‌های اخیر</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2">شماره</th>
                <th className="p-2">نوع</th>
                <th className="p-2">واحد</th>
                <th className="p-2">کارگاه</th>
                <th className="p-2">تاریخ</th>
                <th className="p-2">وضعیت</th>
                <th className="p-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2">{req.request_number}</td>
                  <td className="p-2">{typeLabels[req.type] || req.type}</td>
                  <td className="p-2">{req.unit_name || '-'}</td>
                  <td className="p-2">{req.workshop_name || '-'}</td>
                  <td className="p-2">{req.date_shamsi || '-'}</td>
                  <td className="p-2">
                    <span className={`px-3 py-1 rounded-full text-xs ${statusPalette[req.status] || 'bg-slate-200'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-2 space-x-2 space-x-reverse">
                    <button
                      onClick={() => selectRequest(req.id)}
                      className="text-mining-accent text-xs inline-flex items-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" /> نمایش
                    </button>
                    <button
                      onClick={() => handleTimeline(req.id)}
                      className="text-blue-500 text-xs inline-flex items-center gap-1"
                    >
                      <ClockIcon className="w-4 h-4" /> تاریخچه
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRequest && (
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-4 items-center">
            <div>
              <h3 className="text-lg font-bold text-mining-accent">درخواست {selectedRequest.request_number}</h3>
              <p className="text-sm text-slate-500">نوع: {selectedRequest.type}</p>
            </div>
            <QRView value={`cmms://request/${selectedRequest.id}`} label="QR درخواست" />
          </div>

          <div className="space-y-4">
            {itemDrafts.map((item, idx) => (
              <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">#{idx + 1} - {item.name}</h4>
                  <button
                    onClick={() => handleTimeline(selectedRequest.id, idx)}
                    className="text-blue-500 text-sm inline-flex items-center gap-1"
                  >
                    <ClockIcon className="w-4 h-4" /> تاریخچه قلم
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                  <select
                    value={item.status}
                    onChange={(e) => setItemDrafts((prev) => prev.map((it, i) => (i === idx ? { ...it, status: e.target.value } : it)))}
                    className="border border-slate-300 rounded-md px-2 py-1"
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setItemDrafts((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity: Number(e.target.value) } : it)))}
                    className="border border-slate-300 rounded-md px-2 py-1"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => setItemDrafts((prev) => prev.map((it, i) => (i === idx ? { ...it, unit: e.target.value } : it)))}
                    className="border border-slate-300 rounded-md px-2 py-1"
                  />
                  <input
                    type="text"
                    value={item.serial}
                    onChange={(e) => setItemDrafts((prev) => prev.map((it, i) => (i === idx ? { ...it, serial: e.target.value } : it)))}
                    className="border border-slate-300 rounded-md px-2 py-1"
                  />
                </div>
                <textarea
                  value={item.note || ''}
                  onChange={(e) => setItemDrafts((prev) => prev.map((it, i) => (i === idx ? { ...it, note: e.target.value } : it)))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1"
                  rows={2}
                  placeholder="یادداشت"
                />
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="text-xs">بارگذاری تصویر قبل</label>
                  <input
                    type="file"
                    onChange={(e) => e.target.files && handleUpload(selectedRequest.id, idx, e.target.files[0], 'before')}
                    className="text-xs"
                    accept="image/*,application/pdf"
                  />
                  <label className="text-xs">بارگذاری تصویر بعد</label>
                  <input
                    type="file"
                    onChange={(e) => e.target.files && handleUpload(selectedRequest.id, idx, e.target.files[0], 'after')}
                    className="text-xs"
                    accept="image/*,application/pdf"
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(selectedRequest.attachments || [])
                    .filter((att) => att.item_index !== null && Number(att.item_index) === idx)
                    .map((att) => {
                      const url = new URL(att.path, assetBase).toString();
                      return (
                        <a
                          key={att.id}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-blue-500"
                        >
                          فایل {att.type}
                        </a>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {selectedRequest.attachments?.some((att) => att.item_index === null) && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm space-y-2">
              <h4 className="font-semibold">فایل‌های مرتبط با کل درخواست</h4>
              <div className="flex flex-wrap gap-2">
                {selectedRequest.attachments
                  .filter((att) => att.item_index === null)
                  .map((att) => {
                    const url = new URL(att.path, assetBase).toString();
                    return (
                      <a
                        key={att.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-500"
                      >
                        فایل {att.type}
                      </a>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm">یادداشت وضعیت</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>
          <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-2 rounded-md inline-flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" /> ثبت به‌روزرسانی وضعیت
          </button>
        </section>
      )}

      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">راهنمای رنگ وضعیت‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {statuses.map((status) => (
            <div key={status} className={`rounded-lg px-4 py-3 ${statusPalette[status]}`}>
              {status}
            </div>
          ))}
        </div>
      </section>

      <TimelineModal
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        history={timeline}
        title="تاریخچه رویداد"
      />
    </div>
  );
};

export default Dashboard;
