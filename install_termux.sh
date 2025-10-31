#!/data/data/com.termux/files/usr/bin/bash

set -euo pipefail

# Ensure we are running inside Termux
if [ -z "${TERMUX_VERSION-}" ] && ! command -v termux-info >/dev/null 2>&1; then
  echo "[!] این اسکریپت فقط برای محیط Termux طراحی شده است." >&2
  echo "    لطفاً آن را داخل ترموکس اجرا کنید." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

step() {
  echo
  echo "=============================="
  echo "➡️  $1"
  echo "=============================="
}

pkg_install() {
  if command -v pkg >/dev/null 2>&1; then
    PKG_CMD=pkg
  elif command -v apt >/dev/null 2>&1; then
    PKG_CMD=apt
  else
    echo "[!] Neither pkg nor apt package manager found."
    exit 1
  fi

  step "به‌روزرسانی مخازن بسته‌ها"
  $PKG_CMD update -y
  if [ "$PKG_CMD" = "pkg" ]; then
    $PKG_CMD upgrade -y
  fi

  step "نصب پیش‌نیازها"
  $PKG_CMD install -y git php composer nodejs-lts npm sqlite openssl-tool
}

ensure_backend_env() {
  step "آماده‌سازی تنظیمات Laravel"
  cd "$REPO_ROOT/backend"

  if [ ! -f .env ]; then
    cp .env.example .env
  fi

  if ! grep -q '^DB_CONNECTION=sqlite' .env; then
    sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env
  fi

  if ! grep -q '^DB_DATABASE=' .env; then
    printf '\nDB_DATABASE=%s\n' "${REPO_ROOT}/backend/database/database.sqlite" >> .env
  else
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=${REPO_ROOT}/backend/database/database.sqlite|" .env
  fi

  sed -i 's/^DB_HOST=.*/DB_HOST=null/' .env || true
  sed -i 's/^DB_PORT=.*/DB_PORT=null/' .env || true
  sed -i 's/^DB_USERNAME=.*/DB_USERNAME=null/' .env || true
  sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=null/' .env || true

  mkdir -p database
  if [ ! -f database/database.sqlite ]; then
    touch database/database.sqlite
  fi
}

install_backend() {
  step "نصب وابستگی‌های Composer"
  cd "$REPO_ROOT/backend"
  composer install --no-interaction --prefer-dist

  step "تولید کلید برنامه و JWT"
  php artisan key:generate --force
  php artisan jwt:secret --force

  step "اجرای مایگریشن‌ها و داده نمونه"
  php artisan migrate --seed --force

  step "ایجاد لینک ذخیره‌سازی فایل‌ها"
  php artisan storage:link || true
}

install_frontend() {
  step "نصب وابستگی‌های React"
  cd "$REPO_ROOT/frontend"
  npm install
}

main() {
  pkg_install
  ensure_backend_env
  install_backend
  install_frontend

  step "پایان"
  cat <<'MSG'
✅ نصب و راه‌اندازی پروژه با موفقیت در Termux انجام شد.

برای اجرای بک‌اند:
  cd backend
  php artisan serve --host=0.0.0.0 --port=8000

برای اجرای فرانت‌اند:
  cd frontend
  npm start
MSG
}

main "$@"
