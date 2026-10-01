# Đặc tả hạ tầng — marhub.vaschools.edu.vn

Bản kê **chính xác** mọi thành phần hạ tầng của hệ thống production: máy chủ,
tài khoản, cổng, đường dẫn, dịch vụ, quyền hạn. Dùng để tra cứu khi vận hành,
bàn giao, hoặc dựng lại hệ thống.

Số liệu xác minh ngày **2026-10-01**. Thay đổi hạ tầng thì cập nhật file này.

> Thiết kế và lý do chọn: [deployment-design.md](deployment-design.md)
> Quy trình thao tác: [deployment-runbook.md](deployment-runbook.md)

---

## 1. Máy chủ

| Hạng mục | Giá trị |
|---|---|
| Hostname | `vas-linuxsrv2` |
| IP công khai | `113.176.63.40` |
| Hệ điều hành | Ubuntu 22.04.5 LTS |
| SSH port | `222` (không phải 22) |
| Control panel | CloudPanel 6.0.8 |
| Dùng chung | **Có** — 25+ site khác đang chạy trên cùng máy |

VPS dùng chung là ràng buộc quan trọng nhất: mọi thay đổi ở tầng hệ thống (cài
gói, sửa cấu hình global, restart dịch vụ dùng chung) đều ảnh hưởng site khác.

---

## 2. Truy cập

### SSH

Hai tài khoản trên cùng máy, mục đích khác nhau:

| Alias | User | Dùng để |
|---|---|---|
| `khoana-trienlamtranh` | `khoana` | Quản trị: sudo, systemd, cài gói |
| `trienlamtranh` | `vaschools-trienlamtranh` | Site user của một dự án khác |

Cấu hình trong `~/.ssh/config`:

```sshconfig
Host khoana-trienlamtranh
    HostName 113.176.63.40
    Port 222
    User khoana
    IdentityFile ~/.ssh/id_ed25519_vas
    IdentitiesOnly yes
```

```bash
ssh khoana-trienlamtranh
```

> **Đăng nhập bằng SSH key, không phải mật khẩu.** Server tắt password
> authentication. Mật khẩu của `khoana` là **mật khẩu sudo** — dùng khi chạy
> lệnh cần quyền root, không dùng để đăng nhập.

`khoana` thuộc group `sudo`, và sudo **yêu cầu nhập mật khẩu** (không NOPASSWD).

### CloudPanel

Giao diện web quản lý site, cổng mặc định của CloudPanel trên máy này. Dùng để
tạo site, cấp chứng chỉ SSL, xem thông tin site. **Không** dùng để deploy.

---

## 3. Site

| Hạng mục | Giá trị |
|---|---|
| Domain | `marhub.vaschools.edu.vn` |
| Site ID (CloudPanel) | 31 |
| Site type | **Python** |
| Site user | `vaschools-marhub` |
| App port | `127.0.0.1:8090` |
| Python version (CloudPanel khai báo) | 3.10 |
| Python version (thực dùng) | **3.11** — xem mục 5 |
| SSL | Có, chứng chỉ tại `/etc/nginx/ssl-certificates/marhub.vaschools.edu.vn.{crt,key}` |

### DNS — cần xử lý

| | |
|---|---|
| A record hiện tại | `115.73.210.29` |
| Phải trỏ về | `113.176.63.40` |

Ứng dụng đã được kiểm chứng chạy đúng bằng `curl --resolve`, nhưng **domain chưa
vào được từ Internet** cho tới khi sửa A record.

---

## 4. Cây thư mục

```
/home/vaschools-marhub/
├── htdocs/marhub.vaschools.edu.vn/      ← document root của nginx
│   ├── current -> releases/<timestamp>  ← symlink tới bản đang chạy
│   ├── releases/                        ← 5 bản gần nhất
│   │   └── 20261001-012128/
│   │       ├── backend/
│   │       │   ├── src/vaschools_mkt/
│   │       │   ├── alembic/
│   │       │   ├── alembic.ini
│   │       │   └── pyproject.toml
│   │       └── static/                  ← SPA build
│   │           ├── index.html           ← app phục vụ (KHÔNG copy ra ngoài)
│   │           ├── assets/
│   │           └── images/
│   ├── shared/                          ← tồn tại qua mọi lần deploy
│   │   ├── .env                         (640, vaschools-marhub)
│   │   ├── venv/                        (~160MB, Python 3.11)
│   │   └── deploy.sh                    (755, root)
│   ├── assets/                          ← nginx phục vụ trực tiếp
│   └── images/                          ← nginx phục vụ trực tiếp
├── logs/
│   ├── api.log                          ← stdout uvicorn
│   ├── api-error.log                    ← stderr uvicorn
│   └── nginx/{access,error}.log
└── tmp/
```

| Đường dẫn | Chủ sở hữu | Quyền |
|---|---|---|
| `shared/.env` | `vaschools-marhub:vaschools-marhub` | `640` |
| `shared/deploy.sh` | `root:root` | `755` |
| `releases/*` | `vaschools-marhub:vaschools-marhub` | `750` |
| `assets/`, `images/` | `vaschools-marhub:vaschools-marhub` | `755` |

---

## 5. Runtime

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Python (hệ thống) | 3.10.12 | CloudPanel alias trỏ vào bản này |
| **Python (ứng dụng)** | **3.11.0rc1** | Cài từ apt. Project yêu cầu `>=3.11` |
| Node.js | 20.20.2 | Chỉ dùng để build frontend ở local |
| nginx | CloudPanel quản lý | **Không sửa vhost thủ công** |
| PostgreSQL | 14.23 | Dùng chung với site khác |
| Redis | 6.0.16 | Dùng chung với site khác |

> **Python 3.11.0rc1 là bản release candidate**, không phải stable — đó là bản
> duy nhất có trong apt của Ubuntu 22.04. Hiện chạy ổn định. Nếu gặp lỗi bất
> thường ở tầng runtime, cân nhắc deadsnakes PPA để lấy bản stable.

Gói đã cài thêm vào hệ thống khi dựng:

```
python3.11  python3.11-venv  python3.11-dev  sqlite3
```

---

## 6. Database

### PostgreSQL

| Hạng mục | Giá trị |
|---|---|
| Host / port | `127.0.0.1:5432` |
| Database | `vaschools_mkt` |
| Role | `vaschools_mkt` (owner của database) |
| Mật khẩu | Trong `shared/.env`, biến `DATABASE_URL` |
| Migration hiện tại | `001_week1 (head)` |

Bảng của schema v1: `domains`, `keywords`, `serp_snapshots`, `rankings`.

### Redis

| Hạng mục | Giá trị |
|---|---|
| Host / port | `localhost:6379` |
| **Database index** | **3** |

> Redis **không có cơ chế phân quyền theo user**. Db index là ranh giới cô lập
> duy nhất giữa các ứng dụng trên máy này. Dùng db 0 sẽ trộn key với site khác,
> và một lệnh `FLUSHDB` của họ sẽ xoá dữ liệu của mình.

---

## 7. Dịch vụ

### systemd: `marhub-api`

| Hạng mục | Giá trị |
|---|---|
| Unit file | `/etc/systemd/system/marhub-api.service` |
| Trạng thái | `enabled` (tự khởi động cùng máy) |
| Chạy dưới user | `vaschools-marhub` |
| Lệnh | `uvicorn vaschools_mkt.api.main:app --host 127.0.0.1 --port 8090 --workers 2 --proxy-headers --forwarded-allow-ips=127.0.0.1` |
| Restart | `always`, sau 5 giây |
| RAM | ~165MB (2 worker) |

Siết quyền:

```ini
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=/home/vaschools-marhub/logs /home/vaschools-marhub/tmp
```

App đọc được code và `.env`, nhưng **chỉ ghi được vào `logs/` và `tmp/`**.

### logrotate: `marhub-api`

| Hạng mục | Giá trị |
|---|---|
| File | `/etc/logrotate.d/marhub-api` |
| Áp dụng cho | `api.log`, `api-error.log` |
| Tần suất | Hàng ngày, giữ 14 bản, nén |
| Phương thức | `copytruncate` |

`copytruncate` là bắt buộc: uvicorn giữ file descriptor mở và không xử lý tín
hiệu reopen. Đổi tên file sẽ khiến nó ghi tiếp vào inode đã mất tên — log mới
biến mất hoàn toàn.

---

## 8. Mạng và định tuyến

```
Internet :443 ──► nginx ──┬─► .js .css .png ...  ──► document root (đọc file)
                          │
                          └─► mọi path khác      ──► 127.0.0.1:8090 (uvicorn)
                                                       │
                                                       ├─ /health, /health/deep
                                                       ├─ /api/docs, /api/v1/*
                                                       ├─ /auth/*
                                                       └─ còn lại → index.html
```

| Cổng | Bind | Dịch vụ | Lộ ra Internet |
|---|---|---|---|
| 443 | `0.0.0.0` | nginx (HTTPS) | Có |
| 80 | `0.0.0.0` | nginx → redirect 443 | Có |
| 8090 | `127.0.0.1` | uvicorn | **Không** |
| 5432 | `127.0.0.1` | PostgreSQL | **Không** |
| 6379 | `127.0.0.1` | Redis | **Không** |
| 222 | `0.0.0.0` | SSH | Có |

Vhost nginx có một block phục vụ file tĩnh thẳng từ document root, không proxy
về app:

```nginx
location ~* ^.+\.(css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|...)$ {
    expires max;
    access_log off;
}
```

Đây là template mặc định của CloudPanel. Deploy đồng bộ asset vào document root
để thuận theo nó — xem [deployment-design.md §3.2](deployment-design.md).

---

## 9. Cấu hình ứng dụng

`shared/.env`, quyền `640`. Không nằm trong git.

| Biến | Giá trị production |
|---|---|
| `ENVIRONMENT` | `production` |
| `APP_NAME` | `VA Schools — Marketing Intelligence` |
| `FRONTEND_URL` | `https://marhub.vaschools.edu.vn` |
| `BACKEND_URL` | `https://marhub.vaschools.edu.vn` |
| `SECRET_KEY` | 64 ký tự ngẫu nhiên |
| `DATABASE_URL` | `postgresql+asyncpg://vaschools_mkt:***@127.0.0.1:5432/vaschools_mkt` |
| `REDIS_URL` | `redis://localhost:6379/3` |
| `VITE_API_URL` | *(rỗng)* |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Đã cấu hình |
| `GOOGLE_ALLOWED_DOMAINS` | `vaschools.edu.vn,hcm.vaschools.edu.vn` |
| `SERP_PROVIDER` | `serpapi` (đã có key) |
| `KEYWORD_PLANNER_PROVIDER` | `fake` |
| `BACKLINK_PROVIDER` | `fake` |
| `MONTHLY_SERP_REQUEST_CAP` | `20000` |

> **Mọi giá trị phải được single-quote.** File này được đọc bởi cả `source` của
> bash lẫn `EnvironmentFile` của systemd; giá trị có khoảng trắng mà không quote
> sẽ gây lỗi `command not found`. Khi thêm biến mới, nhớ quote.

---

## 10. Google OAuth — cần xử lý

| | |
|---|---|
| Redirect URI cần khai báo | `https://marhub.vaschools.edu.vn/auth/google/callback` |
| Trạng thái | **Chưa thêm vào Google Cloud Console** |

Chưa thêm thì đăng nhập sẽ lỗi `redirect_uri_mismatch`.

Chỉ email thuộc `vaschools.edu.vn` và `hcm.vaschools.edu.vn` đăng nhập được.

---

## 11. Kiểm tra sức khoẻ

| Endpoint | Mục đích |
|---|---|
| `GET /health` | Liveness — process còn sống. Dùng cho health check của deploy |
| `GET /health/deep` | Readiness — kết nối DB, Redis, trạng thái cấu hình provider |
| `GET /api/docs` | OpenAPI UI |

`/health/deep` **không gọi API tốn phí**, gọi thoải mái. Phản hồi mẫu:

```json
{"status":"ok","environment":"production","database":true,"redis":true,
 "google_configured":true,"serp_provider":"serpapi","serp_provider_configured":true}
```

---

## 12. Khoảng trống đã biết

| Hạng mục | Mức | Hiện trạng |
|---|---|---|
| **Backup PostgreSQL** | Cao | **Chưa có.** Cần cron `pg_dump` hàng ngày, giữ 30 ngày |
| **DNS trỏ sai** | Cao | Cần sửa A record về `113.176.63.40` |
| **Google redirect URI** | Cao | Cần thêm vào Cloud Console |
| Staging | Trung bình | Chưa có. Deploy thẳng production |
| Giám sát / cảnh báo | Trung bình | Chưa có. Mới có endpoint health, chưa ai gọi định kỳ |
| Celery worker/beat | — | Thuộc tuần 2, chưa triển khai |

Về backup: `serp_snapshots` và `keyword_metrics_raw` là **dữ liệu đã trả tiền để
có**. Mất thì phải mua lại.
