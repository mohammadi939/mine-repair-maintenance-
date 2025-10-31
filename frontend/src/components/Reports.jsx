import React, { useEffect, useMemo, useState } from 'react';
import ShamsiDatePicker from './ShamsiDatePicker';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRView from './QRView';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const statuses = ['ارسال به تعمیرگاه','در حال تعمیر','تعمیر شده','غیر قابل تعمیر','صرفه اقتصادی ندارد','داغی','نامعلوم'];

const Reports = ({ api }) => {
  const [range, setRange] = useState({ from: '', to: '' });
  const [data, setData] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(() => {
    const raw = localStorage.getItem('cmms-selected-request');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (range.from) params.append('from', range.from);
        if (range.to) params.append('to', range.to);
        const response = await api.get(`/requests.php?action=report&${params.toString()}`);
        setData(response.data.report || []);
      } catch (error) {
        toast.error(error.message);
      }
    };
    if (api) {
      fetchData();
    }
  }, [range, api]);

  const chartData = useMemo(() => {
    const counts = statuses.map((status) => {
      const record = data.find((item) => item.status === status);
      return record ? Number(record.total) : 0;
    });
    return {
      labels: statuses,
      datasets: [
        {
          label: 'تعداد درخواست‌ها',
          data: counts,
          backgroundColor: '#f59e0b',
        },
      ],
    };
  }, [data]);

  const handleExportPdf = async () => {
    if (!selectedRequest) {
      toast.warn('درخواست موردنظر را از داشبورد انتخاب کنید.');
      return;
    }
    const element = document.getElementById('request-pdf-preview');
    if (!element) {
      toast.error('پیش‌نمایش یافت نشد.');
      return;
    }
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`request-${selectedRequest.request_number}.pdf`);
    toast.success('PDF دانلود شد.');
  };

  const loadFromLocal = () => {
    const raw = localStorage.getItem('cmms-selected-request');
    if (!raw) {
      toast.info('ابتدا در داشبورد یک درخواست را انتخاب کنید.');
      return;
    }
    setSelectedRequest(JSON.parse(raw));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ShamsiDatePicker value={range.from} onChange={(v) => setRange((prev) => ({ ...prev, from: v }))} label="از تاریخ" />
        <ShamsiDatePicker value={range.to} onChange={(v) => setRange((prev) => ({ ...prev, to: v }))} label="تا تاریخ" />
        <div className="flex items-end">
          <button
            onClick={handleExportPdf}
            className="w-full bg-mining-accent text-white py-2 rounded-md hover:bg-amber-500"
          >
            خروجی PDF از درخواست انتخاب‌شده
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={loadFromLocal} className="text-sm text-blue-500">
          بارگیری آخرین درخواست انتخاب‌شده از داشبورد
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
        <Bar data={chartData} />
      </div>

      {selectedRequest ? (
        <div id="request-pdf-preview" className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-mining-accent">جزئیات درخواست {selectedRequest.request_number}</h3>
              <p className="text-sm text-slate-500">واحد: {selectedRequest.unit_name || 'ثبت نشده'}</p>
              <p className="text-sm text-slate-500">کارگاه: {selectedRequest.workshop_name || 'ثبت نشده'}</p>
            </div>
            <QRView value={`cmms://request/${selectedRequest.id}`} label="QR درخواست" />
          </div>
          <table className="w-full text-sm border border-slate-200 dark:border-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">شرح</th>
                <th className="p-2">سریال</th>
                <th className="p-2">وضعیت</th>
                <th className="p-2">تعداد</th>
              </tr>
            </thead>
            <tbody>
              {selectedRequest.items.map((item, idx) => (
                <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.serial || '-'}</td>
                  <td className="p-2">{item.status}</td>
                  <td className="p-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-slate-500">برای تهیه PDF، از داشبورد یک درخواست را انتخاب کنید.</div>
      )}
    </div>
  );
};

export default Reports;
