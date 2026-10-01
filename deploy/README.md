# deploy/

Script và file cấu hình triển khai `marhub.vaschools.edu.vn`.

| File | Chạy ở đâu | Nhiệm vụ |
|---|---|---|
| `release.sh` | **Máy local** | Build frontend, đóng gói, upload, gọi `deploy.sh` qua SSH |
| `deploy.sh` | **Server** (`shared/deploy.sh`, cần sudo) | Giải nén, cài deps, migrate, đổi symlink, restart, health check |
| `marhub-api.service` | Server (`/etc/systemd/system/`) | Unit chạy uvicorn 2 worker dưới user `vaschools-marhub` |
| `marhub-api.logrotate` | Server (`/etc/logrotate.d/`) | Xoay `api.log` hàng ngày, giữ 14 bản |
| `nginx-marhub.conf.reference` | — | Bản chụp vhost đang chạy. Tham chiếu khi CloudPanel ghi đè |

## Deploy

```bash
./deploy/release.sh
```

## Khi sửa file trong thư mục này

`deploy.sh`, `marhub-api.service` và `marhub-api.logrotate` **không** đi kèm
release — chúng phải được cài lên server thủ công:

```bash
scp deploy/deploy.sh khoana-trienlamtranh:/home/khoana/tmp/
ssh khoana-trienlamtranh \
  'sudo install -o root -g root -m 755 /home/khoana/tmp/deploy.sh \
   /home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn/shared/deploy.sh'
```

Sửa service hoặc logrotate thì nhớ `sudo systemctl daemon-reload`.

## Tài liệu

- [Đặc tả hạ tầng](../docs/07-ops/infrastructure-spec.md) — máy chủ, cổng, đường dẫn
- [Thiết kế triển khai](../docs/07-ops/deployment-design.md) — kiến trúc và lý do
- [Runbook](../docs/07-ops/deployment-runbook.md) — setup, deploy, rollback, sự cố
