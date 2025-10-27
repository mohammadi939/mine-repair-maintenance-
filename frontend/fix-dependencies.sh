#!/bin/bash
# اسکریپت رفع مشکل TailwindCSS و وابستگی‌ها

echo "🔧 شروع رفع مشکل TailwindCSS..."
echo ""

# حذف node_modules و فایل‌های قفل
echo "1️⃣ پاک کردن node_modules و package-lock.json..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .cache
echo "✅ پاک شد!"
echo ""

# نصب وابستگی‌ها با نسخه‌های خاص
echo "2️⃣ نصب وابستگی‌ها با نسخه‌های صحیح..."
npm install --save \
  tailwindcss@3.3.5 \
  postcss@8.4.31 \
  autoprefixer@10.4.16 \
  react@18.2.0 \
  react-dom@18.2.0 \
  react-router-dom@6.20.0

echo ""
echo "3️⃣ نصب سایر وابستگی‌ها..."
npm install

echo ""
echo "✅ همه چیز نصب شد!"
echo ""
echo "🚀 برای اجرا دستور زیر را اجرا کنید:"
echo "   npm start"
echo ""
