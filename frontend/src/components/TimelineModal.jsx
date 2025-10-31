import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment-jalaali';

const TimelineModal = ({ open, onClose, history = [], title }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-mining-accent">{title}</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800">بستن</button>
            </div>
            <ul className="space-y-4">
              {history.length === 0 && <li className="text-sm text-slate-500">رویدادی ثبت نشده است.</li>}
              {history.map((event, idx) => (
                <li key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-semibold">وضعیت: {event.status}</span>
                    <span className="text-slate-500">کاربر: {event.username || 'سیستم'}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
                    <span>زمان ISO: {event.timestamp_iso}</span>
                    <span>زمان جلالی: {event.timestamp_shamsi}</span>
                    <span>تاریخ خوانا: {moment(event.timestamp_iso).format('jYYYY/jMM/jDD HH:mm')}</span>
                  </div>
                  {event.note && <p className="mt-3 text-sm text-slate-600 dark:text-slate-200">توضیحات: {event.note}</p>}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TimelineModal;
