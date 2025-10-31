import React, { useState } from 'react';
import { toast } from 'react-toastify';

const BackupPanel = ({ api }) => {
  const [uploading, setUploading] = useState(false);

  const handleDownload = () => {
    window.open(`${api.defaults.baseURL}/backup.php`, '_blank');
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('backup', file);
      await api.post('/backup.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('بازیابی انجام شد.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold text-mining-accent">مدیریت نسخه پشتیبان پایگاه‌داده</h2>
      <div className="space-y-3 text-sm">
        <button
          onClick={handleDownload}
          className="bg-mining-accent text-white px-4 py-2 rounded-md"
        >
          دانلود فایل database.sqlite
        </button>
        <div>
          <label className="block mb-2">بارگذاری نسخه پشتیبان (sqlite)</label>
          <input type="file" accept=".sqlite" onChange={handleUpload} disabled={uploading} />
        </div>
        <p className="text-xs text-slate-500">
          توجه: عملیات بازیابی پایگاه‌داده تمام داده‌های فعلی را جایگزین می‌کند. قبل از ادامه از اطلاعات فعلی نسخه پشتیبان تهیه کنید.
        </p>
      </div>
    </div>
  );
};

export default BackupPanel;
