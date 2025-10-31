import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRView = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeCanvas value={value} size={128} includeMargin bgColor="#ffffff" fgColor="#1f2937" />
      {label && <span className="text-xs text-slate-500">{label}</span>}
    </div>
  );
};

export default QRView;
