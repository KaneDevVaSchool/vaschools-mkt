#!/bin/bash
# Deploy marhub.vaschools.edu.vn — chạy TRÊN SERVER với quyền sudo.
#
# Luồng: nhận tarball đã build ở /tmp/marhub-release.tar.gz, giải nén vào
# releases/<timestamp>, cài deps vào venv dùng chung, migrate, rồi đổi symlink
# `current`. Đổi symlink là thao tác nguyên tử — không có khoảng thời gian
# site phục vụ thư mục nửa vời.
set -euo pipefail

SITE_USER=vaschools-marhub
SITE_ROOT=/home/${SITE_USER}/htdocs/marhub.vaschools.edu.vn
SHARED=${SITE_ROOT}/shared
RELEASES=${SITE_ROOT}/releases
STAMP=$(date +%Y%m%d-%H%M%S)
NEW=${RELEASES}/${STAMP}
TARBALL=${1:-/tmp/marhub-release.tar.gz}
KEEP=5

echo "==> Chuẩn bị thư mục"
install -d -o "${SITE_USER}" -g "${SITE_USER}" -m 750 "${RELEASES}" "${SHARED}" "${NEW}"

echo "==> Giải nén release ${STAMP}"
tar -xzf "${TARBALL}" -C "${NEW}"
chown -R "${SITE_USER}:${SITE_USER}" "${NEW}"

echo "==> Venv (Python 3.11)"
if [ ! -x "${SHARED}/venv/bin/python" ]; then
  /usr/bin/python3.11 -m venv "${SHARED}/venv"
  chown -R "${SITE_USER}:${SITE_USER}" "${SHARED}/venv"
fi
"${SHARED}/venv/bin/pip" install --quiet --upgrade pip wheel
"${SHARED}/venv/bin/pip" install --quiet -e "${NEW}/backend"

echo "==> Migrate database"
cd "${NEW}/backend"
set -a; . "${SHARED}/.env"; set +a
"${SHARED}/venv/bin/alembic" upgrade head

echo "==> Đổi symlink current -> ${STAMP}"
ln -sfn "${NEW}" "${SITE_ROOT}/current.tmp"
mv -Tf "${SITE_ROOT}/current.tmp" "${SITE_ROOT}/current"
chown -h "${SITE_USER}:${SITE_USER}" "${SITE_ROOT}/current"

# Vhost CloudPanel serve file tĩnh (.js/.css/ảnh) thẳng từ document root thay
# vì proxy về app, nên build phải có mặt ở đó. index.html vẫn do app trả, để
# SPA fallback hoạt động cho mọi route.
#
# Chỉ đồng bộ vào từng thư mục asset con. KHÔNG rsync --delete vào SITE_ROOT:
# ở đó còn releases/, shared/ và current, --delete sẽ xoá sạch chúng.
echo "==> Đồng bộ asset tĩnh vào document root"
for d in assets images; do
  if [ -d "${NEW}/static/${d}" ]; then
    install -d -o "${SITE_USER}" -g "${SITE_USER}" "${SITE_ROOT}/${d}"
    rsync -a --delete "${NEW}/static/${d}/" "${SITE_ROOT}/${d}/"
    chown -R "${SITE_USER}:${SITE_USER}" "${SITE_ROOT}/${d}"
  fi
done
# File lẻ ở gốc build (favicon, robots.txt, ...) — copy, không xoá gì.
find "${NEW}/static" -maxdepth 1 -type f ! -name index.html -exec cp -f {} "${SITE_ROOT}/" \;

echo "==> Restart service"
systemctl restart marhub-api
sleep 3
systemctl is-active --quiet marhub-api || { echo "LỖI: service không chạy"; journalctl -u marhub-api -n 40 --no-pager; exit 1; }

echo "==> Health check"
for i in $(seq 1 10); do
  if curl -fsS --max-time 5 http://127.0.0.1:8090/health >/dev/null 2>&1; then
    echo "OK: API trả lời sau ${i}s"
    break
  fi
  [ "$i" = 10 ] && { echo "LỖI: health check thất bại"; tail -40 /home/${SITE_USER}/logs/api-error.log; exit 1; }
  sleep 1
done

echo "==> Dọn release cũ (giữ ${KEEP})"
cd "${RELEASES}"
ls -1dt */ 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -rf

echo "==> Xong: ${STAMP}"
curl -s http://127.0.0.1:8090/health/deep | head -c 400; echo
