import React from 'react';
import DatePicker from 'react-datepicker2';
import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

const ShamsiDatePicker = ({ value, onChange, label }) => {
  const momentValue = value ? moment(value, 'jYYYY/jMM/jDD') : null;
  return (
    <div className="flex flex-col gap-1 text-right">
      {label && <span className="text-sm text-slate-500">{label}</span>}
      <DatePicker
        isGregorian={false}
        timePicker={false}
        value={momentValue}
        onChange={(m) => onChange(m ? m.format('jYYYY/jMM/jDD') : '')}
        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-mining-accent"
        inputJalaaliFormat="jYYYY/jMM/jDD"
        placeholder="انتخاب تاریخ"
      />
    </div>
  );
};

export default ShamsiDatePicker;
