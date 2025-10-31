import React, { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, getAttachments, uploadFile } from '../api';

const formatAttachmentDate = (value) => {
  if (!value) return '';
  try {
    const normalized = value.replace(' ', 'T');
    const date = new Date(`${normalized}Z`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('fa-IR');
  } catch (err) {
    return value;
  }
};

const AttachmentManager = ({ entityType, entityId, title, onRemove }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAttachments = async () => {
      if (!entityId) {
        if (isMounted) {
          setAttachments([]);
        }
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await getAttachments(entityType, entityId);
        if (isMounted) {
          setAttachments(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'خطا در دریافت پیوست‌ها');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAttachments();

    return () => {
      isMounted = false;
    };
  }, [entityType, entityId, refreshToken]);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setError('');
    setSuccess('');
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('انتخاب فایل الزامی است');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await uploadFile(entityType, entityId, file);
      setSuccess('فایل با موفقیت آپلود شد');
      setRefreshToken((token) => token + 1);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">
            فرمت‌های مجاز: JPG، JPEG، PNG، GIF، PDF، DOC، DOCX (حداکثر ۵ مگابایت)
          </p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="self-start text-sm text-red-600 hover:text-red-700"
          >
            حذف از لیست
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <form onSubmit={handleUpload} className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 md:w-auto"
        >
          {uploading ? 'در حال آپلود...' : 'آپلود فایل'}
        </button>
      </form>

      <div>
        <h5 className="mb-2 text-sm font-medium text-gray-700">فایل‌های بارگذاری‌شده</h5>
        {loading ? (
          <div className="text-sm text-gray-500">در حال بارگذاری...</div>
        ) : attachments.length === 0 ? (
          <div className="text-sm text-gray-500">فایلی ثبت نشده است.</div>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 md:flex-row md:items-center md:justify-between"
              >
                <a
                  href={`${API_BASE_URL}/${attachment.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {attachment.file_name}
                </a>
                <span className="text-xs text-gray-500 md:text-right">
                  {formatAttachmentDate(attachment.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AttachmentManager;
