#!/bin/bash
# Build + đẩy release lên server. Chạy TỪ MÁY LOCAL, trong repo root.
#
#   ./deploy/release.sh
#
# Yêu cầu: SSH host alias `khoana-trienlamtranh` trong ~/.ssh/config.
set -euo pipefail

SSH_HOST=${SSH_HOST:-khoana-trienlamtranh}
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
STAGE=$(mktemp -d)
trap 'rm -rf "${STAGE}"' EXIT

cd "${REPO_ROOT}"

echo "==> Kiểm tra working tree sạch"
if [ -n "$(git status --porcelain)" ]; then
  echo "CẢNH BÁO: còn thay đổi chưa commit — release sẽ dùng file trên đĩa."
fi

echo "==> Build frontend (same-origin: VITE_API_URL rỗng)"
( cd frontend && VITE_API_URL= npm run build )

echo "==> Đóng gói"
mkdir -p "${STAGE}/backend" "${STAGE}/static"
# Backend: chỉ những gì cần để cài và chạy.
cp -r backend/src backend/alembic backend/alembic.ini backend/pyproject.toml "${STAGE}/backend/"
# Frontend build -> static/, FastAPI serve từ đây.
cp -r frontend/dist/* "${STAGE}/static/"
find "${STAGE}" -name '__pycache__' -type d -prune -exec rm -rf {} +

tar -czf "${STAGE}/../marhub-release.tar.gz" -C "${STAGE}" .
TARBALL="${STAGE}/../marhub-release.tar.gz"
echo "    $(du -h "${TARBALL}" | cut -f1)"

echo "==> Upload"
scp -q "${TARBALL}" "${SSH_HOST}:/tmp/marhub-release.tar.gz"
rm -f "${TARBALL}"

echo "==> Deploy trên server"
ssh "${SSH_HOST}" 'sudo bash /home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn/shared/deploy.sh'

echo "==> Hoàn tất: https://marhub.vaschools.edu.vn"
