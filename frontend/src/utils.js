// Convert English numbers to Persian
export const toPersianNumber = (num) => {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (digit) => persianDigits[digit]);
};

// Convert Persian numbers to English
export const toEnglishNumber = (num) => {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = String(num);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i);
  }
  return result;
};

// Format Jalali date from DateObject
export const formatJalaliDate = (dateObj) => {
  if (!dateObj) return '';
  return dateObj.format('YYYY/MM/DD');
};

// Get status badge class
export const getStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  const statusMap = {
    pending: 'status-sending',
    open: 'status-sending',
    'in_progress': 'status-repairing',
    approved: 'status-repaired',
    resolved: 'status-repaired',
    completed: 'status-repaired',
    returned: 'status-delivered',
    closed: 'status-delivered',
    sent: 'status-delivered',
  };
  return statusMap[normalized] || 'status-unknown';
};

// Get form type label
export const getFormTypeLabel = (type) => {
  const typeMap = {
    exit: 'فرم خروج',
    repair: 'فرم تعمیر',
    entry: 'تأیید ورود',
    failure: 'گزارش خرابی',
    notification: 'اعلان تأخیر',
  };
  return typeMap[type] || type;
};

export const translateStatus = (status) => {
  const map = {
    pending: 'در انتظار',
    approved: 'تایید شده',
    rejected: 'رد شده',
    open: 'باز',
    'in_progress': 'در حال انجام',
    resolved: 'حل شده',
    completed: 'تکمیل شده',
    returned: 'بازگشته',
    closed: 'بسته شده',
    sent: 'ارسال شده',
  };
  return map[status] || status;
};

// Generate unique form number
export const generateFormNumber = (prefix = 'F') => {
  const date = new Date();
  const timestamp = date.getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
};

// Validate form items count
export const validateItemsCount = (items, min, max) => {
  if (!Array.isArray(items) || items.length < min || items.length > max) {
    return `تعداد اقلام باید بین ${toPersianNumber(min)} تا ${toPersianNumber(max)} باشد`;
  }
  return null;
};

// Validate item fields
export const validateItem = (item) => {
  if (!item.description || item.description.trim() === '') {
    return 'شرح کالا الزامی است';
  }
  if (!item.quantity || parseFloat(item.quantity) <= 0) {
    return 'تعداد باید بزرگتر از صفر باشد';
  }
  if (!item.unit || item.unit.trim() === '') {
    return 'واحد الزامی است';
  }
  return null;
};
