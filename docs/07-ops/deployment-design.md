# Thiết kế triển khai — marhub.vaschools.edu.vn

Tài liệu **thiết kế**: giải thích hệ thống production được dựng như thế nào và
**vì sao chọn như vậy**. Cần thao tác cụ thể (deploy, rollback, xử lý sự cố) thì
đọc [deployment-runbook.md](deployment-runbook.md).

Trạng thái: **đang chạy** từ 2026-10-01. Môi trường duy nhất là production —
chưa có staging.

---

## 1. Bối cảnh và ràng buộc

Hệ thống phải lên một VPS **đã có sẵn 25+ site khác** đang chạy, quản lý bằng
CloudPanel. Đây là ràng buộc chi phối toàn bộ các quyết định bên dưới.

| Ràng buộc | Hệ quả thiết kế |
|---|---|
| VPS dùng chung, CloudPanel quản lý nginx | Không được sửa nginx thủ công ngoài CloudPanel — nó sẽ ghi đè khi site được cập nhật qua UI |
| Không có Docker trên máy | Bỏ `docker-compose.yml`; chạy thẳng bằng systemd + venv |
| PostgreSQL/Redis dùng chung với site khác | Phải cô lập bằng database riêng và Redis db index riêng |
| Ubuntu 22.04, apt chỉ có Python 3.10 và 3.11 | Project yêu cầu `>=3.11` → cài `python3.11` từ apt |
| CloudPanel Python site chỉ proxy **một** cổng | API và SPA buộc phải đi chung một origin |

> `docs/07-ops/deployment.md` mô tả kiến trúc Docker Compose **dự kiến** từ giai
> đoạn thiết kế. Nó vẫn đúng cho môi trường dev cục bộ, nhưng production không
> dùng Docker. Khi hai tài liệu mâu thuẫn, tài liệu này mô tả thực tế.

---

## 2. Kiến trúc tổng thể

```
                      Internet
                         │ HTTPS :443
                         ▼
        ┌────────────────────────────────────┐
        │  nginx  (CloudPanel quản lý)       │
        │  marhub.vaschools.edu.vn           │
        │                                    │
        │  .js .css .png ─► document root ───┼──► đọc file trực tiếp
        │  mọi path khác ─► proxy :8090 ─────┼──┐
        └────────────────────────────────────┘  │
                                                ▼
        ┌────────────────────────────────────────────────┐
        │  systemd: marhub-api                           │
        │  uvicorn × 2 worker   127.0.0.1:8090           │
        │  user: vaschools-marhub                        │
        │                                                │
        │   /health /api/* /auth/*  ─► router FastAPI    │
        │   mọi path còn lại        ─► index.html (SPA)  │
        └───────────┬─────────────────────┬──────────────┘
                    │                     │
            ┌───────▼───────┐     ┌───────▼───────┐
            │  PostgreSQL   │     │     Redis     │
            │  :5432        │     │  :6379 db 3   │
            │  db riêng     │     │  index riêng  │
            └───────────────┘     └───────────────┘
```

Không có `worker`/`beat` Celery — pipeline batch thuộc tuần 2, chưa triển khai.
Khi thêm, chúng sẽ là hai systemd unit riêng cùng dùng `shared/venv`.

---

## 3. Quyết định thiết kế

### 3.1. SPA và API chung một origin

**Quyết định.** Backend FastAPI phục vụ cả JSON API lẫn file SPA. Không tách
`app.vaschools.edu.vn` + `api.vaschools.edu.vn`.

**Vì sao.** Phiên đăng nhập dùng **cookie session** (`SessionMiddleware`, ký bằng
`SECRET_KEY`). Tách origin sẽ kéo theo một chuỗi phiền phức: CORS với
`allow_credentials`, cookie `SameSite=None; Secure`, và cookie bên thứ ba —
thứ mà Chrome đang siết dần. Chung origin thì cookie là first-party, gửi mặc
định, `SameSite=lax` đủ dùng kể cả khi quay về từ redirect của Google.

Thêm nữa, CloudPanel Python site chỉ cấp **một** reverse proxy tới một cổng. Tách
origin đồng nghĩa phải tạo site thứ hai, thêm chứng chỉ, thêm vhost — đổi lấy
đúng một thứ: hai tên miền.

**Đánh đổi.** API không tái sử dụng được cho client ở domain khác mà không bật
CORS. Hiện chưa có nhu cầu đó. Nếu sau này cần (mobile app, tích hợp chéo),
thêm `CORSMiddleware` cho đúng origin đó — không phải viết lại kiến trúc.

### 3.2. Static asset do nginx phục vụ, index.html do app

Vhost CloudPanel có sẵn block chặn mọi file `.js/.css/ảnh` và phục vụ thẳng từ
document root, **không** proxy về app:

```nginx
location ~* ^.+\.(css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|...)$ {
    add_header Access-Control-Allow-Origin "*";
    expires max;
    access_log off;
}
```

Đây là hành vi của template CloudPanel, **không sửa được bền vững** — CloudPanel
ghi đè vhost khi site thay đổi qua UI. Thay vì chống lại nó, thiết kế thuận theo:
deploy copy `static/assets/` và `static/images/` vào document root để nginx tìm
thấy.

**Lợi ích ngoài dự kiến:** asset tĩnh không chiếm worker của uvicorn. Với 2
worker, mỗi request file tĩnh đi qua Python là một request API bị xếp hàng.

`index.html` thì **không** copy — nó vẫn do FastAPI trả, vì SPA fallback cần
mọi route (`/login`, `/keywords/...`) đều nhận được HTML. Đây cũng là lý do
`index.html` nằm trong danh sách loại trừ khi đồng bộ.

> **Hệ quả cần nhớ:** `index.html` tham chiếu asset theo tên có hash
> (`index-C4_iD56k.js`). Hash đổi mỗi lần build. Vì `index.html` đến từ release
> mới còn asset nằm ở document root, hai nguồn này phải được cập nhật **cùng
> một lần deploy** — script đã bảo đảm điều đó. Đừng copy thủ công cái này mà
> quên cái kia.

### 3.3. Dò thư mục SPA thay vì hardcode đường dẫn

```python
def _find_spa_dir() -> Path:
    if env_dir := os.getenv("SPA_DIR"):
        return Path(env_dir).resolve()
    here = Path(__file__).resolve()
    for parent in here.parents[:6]:
        for candidate in (parent / "static", parent / "frontend" / "dist"):
            if (candidate / "index.html").is_file():
                return candidate
    return here.parents[3] / "static"
```

**Vì sao.** Layout thư mục khác nhau giữa hai môi trường:

| Môi trường | SPA nằm ở |
|---|---|
| Local | `<repo>/frontend/dist/` |
| Production | `<release>/static/` |

Bản đầu tiên hardcode `parents[3]` và **đã sai** ở production: `main.py` nằm sâu
trong `backend/src/vaschools_mkt/api/`, nên `parents[3]` trỏ tới `backend/` chứ
không phải release root. Triệu chứng: API chạy bình thường, SPA trả 404 JSON.

Dò ngược lên cây thư mục chịu được cả hai layout và cả việc đổi độ sâu sau này.
`SPA_DIR` cho phép override tường minh khi cần.

### 3.4. Release theo timestamp + symlink nguyên tử

```
htdocs/marhub.vaschools.edu.vn/
├── current -> releases/20261001-012128   ← symlink
├── releases/
│   ├── 20261001-012128/     ← bản đang chạy
│   │   ├── backend/
│   │   └── static/
│   └── ...                  ← giữ 5 bản gần nhất
├── shared/                  ← tồn tại qua mọi lần deploy
│   ├── .env                 (640, chỉ site user đọc)
│   ├── venv/
│   └── deploy.sh
├── assets/                  ← nginx phục vụ
└── images/                  ← nginx phục vụ
```

**Vì sao symlink.** Giải nén đè lên thư mục đang chạy tạo ra một khoảng thời gian
site phục vụ trạng thái nửa cũ nửa mới. Đổi symlink là **một thao tác
`rename()`** — nguyên tử ở tầng filesystem, không có khoảng giữa.

Chi tiết dễ bỏ sót: `ln -sfn` lên một symlink đã tồn tại **không** nguyên tử, nó
unlink rồi tạo lại. Script tạo `current.tmp` trước rồi `mv -Tf` đè lên:

```bash
ln -sfn "${NEW}" "${SITE_ROOT}/current.tmp"
mv -Tf "${SITE_ROOT}/current.tmp" "${SITE_ROOT}/current"
```

**Vì sao `shared/`.** `.env` chứa bí mật và `venv/` nặng (~160MB). Cả hai không
thuộc về release nào cụ thể. Tách ra ngoài giúp rollback không cần dựng lại venv
và không có nguy cơ ghi đè `.env`.

**Vì sao giữ 5 bản.** Đủ để lùi vài bước khi lỗi chỉ lộ sau một thời gian; không
nhiều tới mức chiếm đĩa.

### 3.5. Cô lập tài nguyên dùng chung

VPS này chạy 25+ site. Mọi tài nguyên đều phải khoanh vùng:

| Tài nguyên | Giá trị | Lý do |
|---|---|---|
| PostgreSQL database | `vaschools_mkt`, owner cùng tên | Role riêng, không đụng database của site khác |
| Redis | `redis://localhost:6379/**3**` | Redis không có khái niệm user; **db index là ranh giới duy nhất**. Dùng db 0 sẽ trộn key với site khác và `FLUSHDB` của họ xoá dữ liệu của mình |
| Cổng ứng dụng | `127.0.0.1:8090` | CloudPanel cấp khi tạo site. Bind loopback — chỉ nginx gọi được, không lộ ra Internet |
| OS user | `vaschools-marhub` | CloudPanel tạo. Service chạy dưới user này, không phải root |

### 3.6. systemd thay vì Docker / supervisor

| Phương án | Vì sao không |
|---|---|
| Docker Compose | Máy không có Docker. Cài vào VPS đang chạy 25 site là rủi ro không cần thiết cho một app |
| supervisor | Thêm một tầng quản lý process trong khi systemd đã có sẵn và các site khác không dùng |
| CloudPanel tự quản | CloudPanel Python site **chỉ** tạo vhost + cấp cổng; nó không sinh service. Phải tự viết unit |

Unit file siết quyền ở mức hợp lý:

```ini
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full          # /usr, /boot, /etc chỉ đọc
ProtectHome=read-only       # /home chỉ đọc...
ReadWritePaths=/home/vaschools-marhub/logs /home/vaschools-marhub/tmp
```

`ProtectHome=read-only` kèm `ReadWritePaths` nghĩa là: app đọc được code và
`.env`, nhưng **chỉ ghi được vào logs và tmp**. Một lỗ hổng trong app không thể
sửa code của chính nó hay của site khác.

`Restart=always` + `RestartSec=5`: app chết thì tự dậy sau 5 giây.

### 3.7. Hai worker uvicorn

Đủ cho tải nội bộ (vài chục người dùng), và quan trọng hơn là khi một worker
đang xử lý request chậm (gọi SERP API), worker kia vẫn phục vụ được. Một worker
thì mọi request nối đuôi nhau.

Không chọn nhiều hơn vì VPS dùng chung và mỗi worker tốn ~80MB RAM. Tăng khi
thực sự thấy nghẽn, không phải phỏng đoán trước.

---

## 4. Luồng deploy

```
MÁY LOCAL                              SERVER
─────────                              ──────
release.sh
  │
  ├─ npm run build  (VITE_API_URL="")
  │    └─► frontend/dist/
  │
  ├─ đóng gói tarball
  │    backend/{src,alembic,alembic.ini,pyproject.toml}
  │    static/  ← từ frontend/dist
  │
  ├─ scp ──────────────────────────────► /tmp/marhub-release.tar.gz
  │
  └─ ssh sudo deploy.sh ───────────────► ┌─────────────────────────────┐
                                         │ 1. giải nén → releases/<ts> │
                                         │ 2. pip install -e backend   │
                                         │ 3. alembic upgrade head     │
                                         │ 4. đổi symlink current      │
                                         │ 5. đồng bộ asset → doc root │
                                         │ 6. systemctl restart        │
                                         │ 7. health check (10s)       │
                                         │ 8. dọn release cũ (giữ 5)   │
                                         └─────────────────────────────┘
```

**`VITE_API_URL=""` khi build.** `client.ts` đọc biến này làm base URL. Để rỗng
thì fetch dùng đường dẫn tương đối (`/api/v1/...`) — tự trỏ về đúng origin đang
phục vụ. Build mà quên biến này, SPA production sẽ gọi `http://localhost:8000`.

**Migration chạy trước khi đổi symlink.** Nếu migration hỏng, script dừng
(`set -e`) và `current` vẫn trỏ bản cũ — site không bị ảnh hưởng.

**Health check là cổng chặn.** Script không báo thành công cho tới khi
`/health` trả 200. Service chết sau restart thì deploy exit khác 0 kèm 40 dòng
log cuối.

---

## 5. Cấu hình

`.env` production nằm ở `shared/.env`, quyền `640`, chủ sở hữu `vaschools-marhub`.
Không nằm trong git, không nằm trong release.

| Biến | Giá trị production | Khác với dev |
|---|---|---|
| `ENVIRONMENT` | `production` | Bật `https_only` cho cookie; chặn `SECRET_KEY` mặc định |
| `SECRET_KEY` | 64 ký tự ngẫu nhiên | Dev dùng `dev-only-...` |
| `FRONTEND_URL` / `BACKEND_URL` | `https://marhub.vaschools.edu.vn` | Cùng giá trị — hệ quả của chung origin |
| `DATABASE_URL` | `...@127.0.0.1:5432/vaschools_mkt` | Dev dùng cổng 5433 (Docker) |
| `REDIS_URL` | `redis://localhost:6379/**3**` | Dev dùng db 0 |
| `VITE_API_URL` | rỗng | Dev là `http://localhost:8000` |

Google OAuth và SERP API key giữ nguyên từ dev — cùng tài khoản.

### Mọi giá trị phải được quote

`.env` được **cả hai** bên đọc: `deploy.sh` dùng `source`, systemd dùng
`EnvironmentFile`. Cả hai đều diễn giải khoảng trắng.

```bash
APP_NAME=VA Schools — Marketing Intelligence     # ✗ shell hiểu "Schools" là lệnh
APP_NAME='VA Schools — Marketing Intelligence'   # ✓
```

Lỗi này đã xảy ra thật ở lần deploy đầu (`line 5: Schools: command not found`).
Tất cả giá trị trong `shared/.env` hiện đã được single-quote. **Khi thêm biến
mới, nhớ quote.**

### Startup validation

`config.py` chặn khởi động nếu `ENVIRONMENT=production` mà `SECRET_KEY` vẫn là
giá trị mặc định. Triết lý xuyên suốt dự án: sai cấu hình thì chết ngay lúc
khởi động, không phải lúc 2 giờ sáng giữa một job.

Tương tự, mọi provider mặc định `fake`: **quên cấu hình gây mất chức năng, không
gây mất tiền.**

---

## 6. Vận hành

### Log

| File | Nội dung |
|---|---|
| `/home/vaschools-marhub/logs/api.log` | stdout uvicorn — log ứng dụng (JSON) |
| `/home/vaschools-marhub/logs/api-error.log` | stderr — traceback, lỗi khởi động |
| `/home/vaschools-marhub/logs/nginx/access.log` | request HTTP |
| `/home/vaschools-marhub/logs/nginx/error.log` | lỗi tầng nginx |

Logrotate (`/etc/logrotate.d/marhub-api`): xoay hàng ngày, giữ 14 bản, nén.

Dùng `copytruncate` vì uvicorn giữ file descriptor mở và không xử lý tín hiệu
reopen — đổi tên file sẽ khiến nó tiếp tục ghi vào inode cũ đã mất tên, log mới
biến mất hoàn toàn. `copytruncate` có khoảng hở lý thuyết là vài dòng log bị mất
đúng lúc cắt; đánh đổi đó chấp nhận được so với mất toàn bộ.

### Giám sát

| Endpoint | Dùng để |
|---|---|
| `/health` | Liveness — chỉ xác nhận process còn sống. Dùng cho health check của deploy |
| `/health/deep` | Readiness — kiểm tra kết nối DB, Redis, trạng thái cấu hình provider |

`/health/deep` **không** gọi API tốn phí. Gọi được thoải mái.

### Sao lưu

Đây là **khoảng trống đã biết**: PostgreSQL chưa có backup tự động cho database
này.

Mức ưu tiên không phải là chuyện lý thuyết: `serp_snapshots` và
`keyword_metrics_raw` là **dữ liệu đã trả tiền để có**. Mất thì phải mua lại.
Xem [deployment.md](deployment.md#sao-lưu).

---

## 7. Rủi ro đã biết

| Rủi ro | Mức | Hiện trạng |
|---|---|---|
| **Chưa có backup database** | Cao | Chưa xử lý. Cần cron `pg_dump` hàng ngày, giữ 30 ngày |
| **Python 3.11.0rc1** | Trung bình | Apt Ubuntu 22.04 chỉ có bản release candidate. Chạy ổn, nhưng không phải bản stable. Cân nhắc deadsnakes PPA nếu gặp lỗi lạ |
| **CloudPanel ghi đè vhost** | Trung bình | Sửa site qua UI CloudPanel có thể reset vhost. Asset vẫn chạy (dựa vào template mặc định), nhưng nên kiểm tra lại sau mỗi lần đụng UI |
| **Không có staging** | Trung bình | Deploy thẳng production. Rollback nhanh (đổi symlink) là biện pháp bù |
| **Một điểm chết** | Thấp | Một VPS, không HA. Chấp nhận được với công cụ nội bộ |
| **SECRET_KEY xoay vòng làm mất session** | Thấp | Đổi key khiến mọi người phải đăng nhập lại. Không mất dữ liệu |

### Việc còn lại ngoài phạm vi kỹ thuật

**Google Cloud Console.** Phải thêm
`https://marhub.vaschools.edu.vn/auth/google/callback` vào Authorized redirect
URIs, nếu không đăng nhập sẽ lỗi `redirect_uri_mismatch`.

*(DNS đã trỏ đúng về `113.176.63.40` từ 2026-10-01.)*

---

## 8. Proxy biên và `X-Forwarded-Proto`

Phát hiện khi site lên Internet lần đầu, đáng ghi lại vì nó không nhìn thấy được
từ bên trong server.

Hạ tầng VAS có một **reverse proxy biên đứng trước nginx của VPS**. Nó terminate
TLS rồi chuyển tiếp xuống nginx bằng HTTP. Với nginx, `$scheme` vì vậy **luôn**
là `http`, kể cả khi người dùng vào bằng HTTPS.

Vhost Python do CloudPanel sinh ra kiểm tra `$scheme` trực tiếp:

```nginx
if ($scheme != "https") {              # luôn đúng → lặp vô hạn
  rewrite ^ https://$host$uri permanent;
}
```

Kết quả: `ERR_TOO_MANY_REDIRECTS` từ Internet, trong khi `curl` trên chính
server vẫn trả 200 — vì nó không đi qua proxy biên. Chính sự khác biệt đó là
manh mối: client IP trong access log là IP của server chứ không phải của người
dùng.

Bản sửa dùng đúng mẫu của mọi site khác trên VPS:

```nginx
set $scheme_custom $scheme;
if ($http_x_forwarded_proto = "https") {
  set $scheme_custom "https";
}
if ($scheme_custom != "https") {
  rewrite ^ https://$host$uri permanent;
}
```

**Vì sao template PHP có mà template Python không.** Site PHP của CloudPanel
chạy sau Varnish, nên template của nó vốn đã phải xử lý trường hợp giao thức bị
che. Template Python giả định nginx là tầng ngoài cùng — đúng với cài đặt
CloudPanel tiêu chuẩn, sai với hạ tầng có proxy biên như ở đây.

**Rủi ro còn lại:** đoạn sửa này nằm ngoài template. Sửa site qua UI CloudPanel
có thể ghi đè vhost và làm lỗi quay lại. Kiểm tra sau mỗi lần đụng UI.

---

## 9. Bài học: sự cố rsync khi dựng hệ thống

Ghi lại vì nó định hình một ràng buộc trong script hiện tại.

Bản `deploy.sh` đầu tiên đồng bộ asset bằng:

```bash
rsync -a --delete --exclude index.html "${NEW}/static/" "${SITE_ROOT}/"
```

`--delete` xoá mọi thứ ở đích mà nguồn không có. Đích là `SITE_ROOT`, và
`SITE_ROOT` chứa `releases/`, `shared/`, `current` — **không** có trong
`static/`. Lệnh này đã xoá venv, `.env` và toàn bộ `backend/` của mọi release.

Service vẫn chạy thêm một lúc vì tiến trình giữ file đã unlink trong bộ nhớ.
Restart là chết hẳn.

Bản hiện tại chỉ `--delete` **trong từng thư mục con**, không bao giờ ở
`SITE_ROOT`:

```bash
for d in assets images; do
  rsync -a --delete "${NEW}/static/${d}/" "${SITE_ROOT}/${d}/"
done
find "${NEW}/static" -maxdepth 1 -type f ! -name index.html -exec cp -f {} "${SITE_ROOT}/" \;
```

**Quy tắc rút ra:** `rsync --delete` chỉ được trỏ vào thư mục mà nội dung của nó
hoàn toàn thuộc quyền sinh ra của deploy. Thư mục chứa cả thứ do deploy tạo lẫn
thứ phải tồn tại lâu dài thì không bao giờ là đích hợp lệ.
