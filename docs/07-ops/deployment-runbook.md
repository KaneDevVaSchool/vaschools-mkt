# Runbook triển khai — marhub.vaschools.edu.vn

Hướng dẫn thao tác từng bước: cài môi trường dev, dựng hạ tầng từ con số không,
deploy, rollback, xử lý sự cố.

> Hạ tầng có gì: [infrastructure-spec.md](infrastructure-spec.md)
> Vì sao thiết kế như vậy: [deployment-design.md](deployment-design.md)

**Ký hiệu trong tài liệu:** lệnh có tiền tố `[local]` chạy trên máy bạn, `[server]`
chạy sau khi đã `ssh khoana-trienlamtranh`.

---

## Phần A — Cài đặt môi trường phát triển

Dành cho người mới vào dự án. Toàn bộ ứng dụng chạy được **không cần bất kỳ API
key nào** nhờ provider mặc định `fake`.

### A1. Yêu cầu

| Phần mềm | Phiên bản |
|---|---|
| Python | >= 3.11 |
| Node.js | >= 20 |
| Docker Desktop | Bất kỳ (chỉ dùng cho PostgreSQL + Redis cục bộ) |
| Git | Bất kỳ |

### A2. Lấy mã nguồn và cấu hình

```bash
[local] git clone <repo-url> vaschools-mkt
[local] cd vaschools-mkt
[local] cp .env.example .env
```

Giữ nguyên `SERP_PROVIDER=fake` trong `.env`. Không cần điền key nào.

### A3. Khởi động PostgreSQL và Redis

```bash
[local] docker compose up -d db redis
```

Postgres cục bộ dùng cổng **5433** (không phải 5432) để tránh xung đột với
Postgres đã cài sẵn trên máy, ví dụ ServBay.

### A4. Backend

```bash
[local] cd backend
[local] python -m venv .venv
[local] .venv\Scripts\activate          # Windows
[local] source .venv/bin/activate       # macOS/Linux
[local] pip install -e ".[dev]"
[local] alembic upgrade head
[local] uvicorn vaschools_mkt.api.main:app --reload
```

API chạy ở `http://localhost:8000`, tài liệu ở `http://localhost:8000/api/docs`.

### A5. Frontend

Mở terminal thứ hai:

```bash
[local] cd frontend
[local] npm install
[local] npm run dev
```

SPA chạy ở `http://localhost:5173`, gọi API qua `VITE_API_URL` trong `.env`.

### A6. Kiểm tra

```bash
[local] curl http://localhost:8000/health/deep
[local] cd backend && pytest
```

`database` và `redis` phải là `true`.

---

## Phần B — Dựng hạ tầng từ đầu

Chỉ cần khi **dựng lại server** hoặc tạo môi trường mới. Hạ tầng hiện tại đã
hoàn tất các bước này.

### B1. Tạo site trên CloudPanel

Trong giao diện CloudPanel: **Sites → Add Site → Create a Python Site**

| Trường | Giá trị |
|---|---|
| Domain Name | `marhub.vaschools.edu.vn` |
| Python Version | 3.10 *(chỉ là khai báo — ta dùng 3.11 ở bước B2)* |
| App Port | `8090` |
| Site User | `vaschools-marhub` |
| Site User Password | *(sinh tự động, lưu lại)* |

CloudPanel sẽ tạo OS user, cây thư mục, vhost nginx và cấp chứng chỉ SSL.

> Dropdown Python chỉ có 3.10, nhưng project yêu cầu `>=3.11`. Không sao —
> venv ở bước B2 dùng Python 3.11 cài riêng, độc lập với khai báo này.

### B2. Cài Python 3.11

```bash
[server] sudo apt-get update
[server] sudo apt-get install -y python3.11 python3.11-venv python3.11-dev
[server] /usr/bin/python3.11 -V
```

### B3. Tạo database và role PostgreSQL

Sinh mật khẩu mạnh trước, rồi:

```bash
[server] sudo -u postgres psql -c "CREATE ROLE vaschools_mkt LOGIN PASSWORD '<mật-khẩu>';"
[server] sudo -u postgres psql -c "CREATE DATABASE vaschools_mkt OWNER vaschools_mkt;"
[server] sudo -u postgres psql -d vaschools_mkt -c "GRANT ALL ON SCHEMA public TO vaschools_mkt;"
```

Kiểm tra:

```bash
[server] PGPASSWORD='<mật-khẩu>' psql -h 127.0.0.1 -U vaschools_mkt -d vaschools_mkt -tc "select 'ok';"
```

### B4. Tạo cây thư mục deploy

```bash
[server] SITE=/home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn
[server] sudo install -d -o vaschools-marhub -g vaschools-marhub -m 750 $SITE/shared $SITE/releases
[server] sudo install -d -o vaschools-marhub -g vaschools-marhub -m 750 /home/vaschools-marhub/logs
[server] sudo touch /home/vaschools-marhub/logs/api.log /home/vaschools-marhub/logs/api-error.log
[server] sudo chown vaschools-marhub:vaschools-marhub /home/vaschools-marhub/logs/api*.log
```

### B5. Tạo file `.env` production

Tạo `shared/.env` với nội dung theo
[infrastructure-spec.md §9](infrastructure-spec.md). Sinh `SECRET_KEY`:

```bash
[local] python -c "import secrets; print(secrets.token_urlsafe(48))"
```

> **Mọi giá trị phải được single-quote**, kể cả giá trị không có khoảng trắng.
> File này được đọc bởi cả `source` của bash lẫn `EnvironmentFile` của systemd.
> `APP_NAME=VA Schools — ...` không quote sẽ gây lỗi `Schools: command not found`.

```bash
APP_NAME='VA Schools — Marketing Intelligence'
ENVIRONMENT='production'
DATABASE_URL='postgresql+asyncpg://vaschools_mkt:...@127.0.0.1:5432/vaschools_mkt'
REDIS_URL='redis://localhost:6379/3'
```

Đặt quyền:

```bash
[server] sudo chown vaschools-marhub:vaschools-marhub $SITE/shared/.env
[server] sudo chmod 640 $SITE/shared/.env
```

Kiểm tra parse được:

```bash
[server] sudo bash -c "set -a; . $SITE/shared/.env; set +a; echo \"[\$APP_NAME]\""
```

Phải in ra đầy đủ tên có khoảng trắng.

### B6. Cài systemd service và logrotate

```bash
[local] scp deploy/marhub-api.service deploy/marhub-api.logrotate khoana-trienlamtranh:/home/khoana/tmp/
```

```bash
[server] sudo install -o root -g root -m 644 /home/khoana/tmp/marhub-api.service /etc/systemd/system/
[server] sudo install -o root -g root -m 644 /home/khoana/tmp/marhub-api.logrotate /etc/logrotate.d/marhub-api
[server] sudo systemctl daemon-reload
[server] sudo systemctl enable marhub-api
[server] sudo logrotate -d /etc/logrotate.d/marhub-api     # dry-run, không được có lỗi
```

### B7. Cài deploy script

```bash
[local] scp deploy/deploy.sh khoana-trienlamtranh:/home/khoana/tmp/
```

```bash
[server] sudo install -o root -g root -m 755 /home/khoana/tmp/deploy.sh $SITE/shared/deploy.sh
```

### B8. Deploy lần đầu

Chuyển sang [Phần C](#phần-c--deploy). Lần chạy đầu sẽ tự tạo venv và chạy
migration.

---

## Phần C — Deploy

### C1. Trước khi deploy

| Kiểm tra | Lệnh |
|---|---|
| Test pass | `[local] cd backend && pytest` |
| Typecheck pass | `[local] cd frontend && npm run typecheck` |
| Đã commit | `[local] git status` |

### C2. Chạy deploy

```bash
[local] cd vaschools-mkt
[local] ./deploy/release.sh
```

Một lệnh duy nhất. Script sẽ:

1. Build frontend với `VITE_API_URL=""` (same-origin)
2. Đóng gói `backend/` + `static/` thành tarball
3. `scp` lên `/tmp/marhub-release.tar.gz`
4. Chạy `deploy.sh` trên server qua SSH

Trên server, `deploy.sh` thực hiện:

| Bước | Hành động | Nếu lỗi |
|---|---|---|
| 1 | Giải nén vào `releases/<timestamp>` | Dừng, `current` chưa đổi |
| 2 | Tạo venv nếu chưa có | Dừng |
| 3 | `pip install -e backend` | Dừng |
| 4 | `alembic upgrade head` | **Dừng, site vẫn chạy bản cũ** |
| 5 | Đổi symlink `current` (nguyên tử) | — |
| 6 | Đồng bộ asset vào document root | — |
| 7 | `systemctl restart marhub-api` | Dừng + in 40 dòng log |
| 8 | Health check, tối đa 10 giây | Dừng + in log lỗi |
| 9 | Dọn release cũ, giữ 5 bản | — |

Migration chạy **trước** khi đổi symlink: migration hỏng thì site không bị ảnh
hưởng.

### C3. Kết quả mong đợi

```
==> Giải nén release 20261001-012128
==> Venv (Python 3.11)
==> Migrate database
==> Đổi symlink current -> 20261001-012128
==> Đồng bộ asset tĩnh vào document root
==> Restart service
==> Health check
OK: API trả lời sau 1s
==> Dọn release cũ (giữ 5)
==> Xong: 20261001-012128
{"status":"ok","environment":"production","database":true,"redis":true,...}
```

### C4. Kiểm tra sau deploy

```bash
[server] curl -s https://marhub.vaschools.edu.vn/health
[server] curl -s https://marhub.vaschools.edu.vn/health/deep
[server] sudo systemctl status marhub-api
```

Khi DNS chưa trỏ đúng, kiểm tra từ chính server bằng `--resolve`:

```bash
[server] curl -sk --resolve marhub.vaschools.edu.vn:443:127.0.0.1 \
         https://marhub.vaschools.edu.vn/ -o /dev/null -w "%{http_code} %{content_type}\n"
```

Danh sách cần xanh:

| Đường dẫn | Mong đợi |
|---|---|
| `/health` | `200`, `{"status":"ok"}` |
| `/` | `200`, `text/html` |
| `/login` | `200`, `text/html` *(SPA fallback)* |
| `/assets/index-*.js` | `200`, `application/javascript` |
| `/api/docs` | `200` |
| `/auth/google/redirect` | `302` → `accounts.google.com` |

---

## Phần D — Rollback

Khi bản mới có lỗi, lùi về bản trước bằng cách đổi symlink.

### D1. Xem các bản có sẵn

```bash
[server] SITE=/home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn
[server] ls -1t $SITE/releases/
[server] readlink $SITE/current
```

### D2. Đổi về bản trước

```bash
[server] PREV=$SITE/releases/<timestamp-cần-lùi>
[server] sudo ln -sfn $PREV $SITE/current.tmp
[server] sudo mv -Tf $SITE/current.tmp $SITE/current
[server] sudo chown -h vaschools-marhub:vaschools-marhub $SITE/current
```

### D3. Đồng bộ lại asset của bản đó

**Bước này bắt buộc.** `index.html` tham chiếu asset theo tên có hash; lùi code
mà quên lùi asset thì trang trắng vì file JS không tồn tại.

```bash
[server] for d in assets images; do
           sudo rsync -a --delete $PREV/static/$d/ $SITE/$d/
         done
[server] sudo chown -R vaschools-marhub:vaschools-marhub $SITE/assets $SITE/images
```

### D4. Restart và kiểm tra

```bash
[server] sudo systemctl restart marhub-api
[server] curl -s http://127.0.0.1:8090/health
```

### Rollback migration

Symlink **không** hoàn tác thay đổi database. Nếu bản lỗi đã chạy migration phá
vỡ tương thích:

```bash
[server] cd $SITE/current/backend
[server] sudo bash -c "set -a; . $SITE/shared/.env; set +a; $SITE/shared/venv/bin/alembic downgrade -1"
```

> Cân nhắc kỹ: `downgrade` có thể **mất dữ liệu** nếu migration đã xoá cột.
> Thường an toàn hơn là giữ schema mới và sửa code.

---

## Phần E — Vận hành thường ngày

### Xem log

```bash
[server] sudo tail -f /home/vaschools-marhub/logs/api.log
[server] sudo tail -f /home/vaschools-marhub/logs/api-error.log
[server] sudo journalctl -u marhub-api -f
[server] sudo tail -f /home/vaschools-marhub/logs/nginx/error.log
```

### Điều khiển service

```bash
[server] sudo systemctl status marhub-api
[server] sudo systemctl restart marhub-api
[server] sudo systemctl stop marhub-api
[server] sudo systemctl start marhub-api
```

### Truy cập database

```bash
[server] sudo -u postgres psql -d vaschools_mkt
```

### Kiểm tra migration hiện tại

```bash
[server] SITE=/home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn
[server] cd $SITE/current/backend
[server] sudo bash -c "set -a; . $SITE/shared/.env; set +a; $SITE/shared/venv/bin/alembic current"
```

### Đổi biến môi trường

```bash
[server] sudo nano $SITE/shared/.env        # nhớ single-quote giá trị
[server] sudo systemctl restart marhub-api
[server] curl -s http://127.0.0.1:8090/health/deep
```

### Nạp lại seed keywords

Script idempotent — chạy nhiều lần an toàn, trùng thì bỏ qua (`ON CONFLICT DO
NOTHING`). Dùng Google Suggest (**miễn phí**, không tốn SERP API).

```bash
[server] SITE=/home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn
[server] sudo -u vaschools-marhub bash -c "cd $SITE/current/backend &&          set -a && . $SITE/shared/.env && set +a &&          PYTHONPATH=src $SITE/shared/venv/bin/python          -m vaschools_mkt.scripts.bootstrap_week1 --skip-migrate"
```

Thêm `--dry-run` để đếm trước mà không ghi DB. Thêm `--skip-expand` nếu chỉ
muốn tạo domain.

Mở rộng bộ từ khóa: sửa `backend/src/vaschools_mkt/data/seed_keywords.yaml`,
deploy, rồi chạy lại lệnh trên.

### Theo dõi và chỉnh quota SerpAPI

Mỗi request tốn ~0.0075 USD. Bộ đếm nằm ở Redis db 3, key theo tháng.

```bash
[server] redis-cli -n 3 get serp:requests:$(date +%Y-%m)      # đã dùng
[server] redis-cli -n 3 ttl serp:requests:$(date +%Y-%m)      # còn sống bao lâu
```

Quota cũng hiển thị ở `/api/v1/platform/status` (trường `serp_quota`) và trong
`meta.quota` của mọi response SERP.

Đổi trần: sửa `MONTHLY_SERP_REQUEST_CAP` trong `shared/.env` rồi restart service.

> **Chỉnh tay bộ đếm bằng `SET` sẽ xoá TTL.** Nhớ đặt lại, nếu không key tồn tại
> vĩnh viễn:
>
> ```bash
> [server] redis-cli -n 3 set serp:requests:$(date +%Y-%m) <giá-trị>
> [server] redis-cli -n 3 expire serp:requests:$(date +%Y-%m) 6048000
> ```

### Sao lưu database thủ công

```bash
[server] sudo -u postgres pg_dump -Fc vaschools_mkt \
         > /home/vaschools-marhub/backups/vaschools_mkt-$(date +%F).dump
```

> Backup tự động **chưa được thiết lập** — xem
> [infrastructure-spec.md §12](infrastructure-spec.md).

---

## Phần F — Xử lý sự cố

### Site trả 502 Bad Gateway

nginx không gọi được uvicorn.

```bash
[server] sudo systemctl status marhub-api
[server] sudo tail -50 /home/vaschools-marhub/logs/api-error.log
[server] sudo ss -ltnp | grep 8090
```

| Nguyên nhân thường gặp | Xử lý |
|---|---|
| Service chết | `sudo systemctl restart marhub-api` |
| Lỗi cú pháp `.env` | Kiểm tra quote, xem mục bên dưới |
| Migration chưa chạy | `alembic upgrade head` |
| Sai mật khẩu DB | Đối chiếu `DATABASE_URL` |

### Service không khởi động được

```bash
[server] sudo journalctl -u marhub-api -n 50 --no-pager
```

Nếu thấy `<từ>: command not found`, đó là **lỗi quote trong `.env`**:

```bash
[server] sudo bash -c "set -a; . $SITE/shared/.env; set +a; echo ok"
```

Sửa bằng cách bọc single-quote quanh giá trị bị lỗi.

Nếu thấy `SECRET_KEY mặc định không được dùng ở production`: `.env` vẫn còn
`SECRET_KEY=dev-only-...`. Sinh key mới và thay vào.

### ERR_TOO_MANY_REDIRECTS — vòng lặp redirect HTTPS

**Triệu chứng.** Trình duyệt báo "đã chuyển hướng bạn quá nhiều lần". Từ ngoài
Internet mọi request trả `301` về chính URL đó, nhưng gọi thẳng trên server lại
trả `200`:

```bash
[local]  curl -sI https://marhub.vaschools.edu.vn/            # 301 lặp vô hạn
[server] curl -sk --resolve marhub.vaschools.edu.vn:443:127.0.0.1          -o /dev/null -w "%{http_code}
" https://marhub.vaschools.edu.vn/   # 200
```

**Nguyên nhân.** Hạ tầng VAS có một **reverse proxy biên đứng trước nginx**. Nó
terminate TLS rồi chuyển tiếp xuống nginx bằng **HTTP**, và báo giao thức gốc
qua header `X-Forwarded-Proto`. Với nginx, biến `$scheme` khi đó luôn là
`http` — kể cả khi người dùng vào bằng HTTPS.

Dấu hiệu nhận biết trong access log: client IP là **chính IP của server**
(`113.176.63.40`) chứ không phải IP người dùng.

Vhost nào kiểm tra `$scheme` trực tiếp sẽ redirect sang HTTPS mãi mãi:

```nginx
if ($scheme != "https") {              # ✗ luôn đúng → lặp vô hạn
  rewrite ^ https://$host$uri permanent;
}
```

**Trạng thái: đã sửa** ngày 2026-10-01. Mục này giữ lại vì lỗi sẽ quay lại nếu
vhost bị CloudPanel ghi đè.

**Cách sửa.** Tin `X-Forwarded-Proto`, giống mọi site khác trên VPS:

```nginx
set $scheme_custom $scheme;
if ($http_x_forwarded_proto = "https") {
  set $scheme_custom "https";
}
if ($scheme_custom != "https") {       # ✓
  rewrite ^ https://$host$uri permanent;
}
```

Áp dụng:

```bash
[server] sudo cp /etc/nginx/sites-enabled/marhub.vaschools.edu.vn.conf{,.bak}
[server] sudo nano /etc/nginx/sites-enabled/marhub.vaschools.edu.vn.conf
[server] sudo nginx -t          # BẮT BUỘC — sai cú pháp sẽ làm sập mọi site
[server] sudo systemctl reload nginx
```

> **Template Python site của CloudPanel thiếu đoạn này**, trong khi template PHP
> và Node.js đều có. Nếu tạo lại site hoặc sửa site qua UI CloudPanel, vhost có
> thể bị ghi đè và lỗi quay lại — kiểm tra lại sau mỗi lần đụng UI.

### Trang trắng, console báo lỗi tải file JS

Asset ở document root không khớp với `index.html` của bản đang chạy.

```bash
[server] curl -sk --resolve marhub.vaschools.edu.vn:443:127.0.0.1 \
         https://marhub.vaschools.edu.vn/ | grep -o '/assets/[^"]*\.js'
[server] ls $SITE/assets/
```

Hai tên file phải khớp. Nếu lệch, đồng bộ lại:

```bash
[server] for d in assets images; do
           sudo rsync -a --delete $SITE/current/static/$d/ $SITE/$d/
         done
[server] sudo chown -R vaschools-marhub:vaschools-marhub $SITE/assets $SITE/images
```

### SPA trả 404 JSON thay vì HTML

App không tìm thấy thư mục SPA. Kiểm tra log khởi động:

```bash
[server] sudo grep "SPA" /home/vaschools-marhub/logs/api.log | tail -3
```

Thấy `Không tìm thấy SPA build tại ...` nghĩa là `static/index.html` thiếu trong
release. Deploy lại. Nếu cần chỉ định tường minh, thêm vào `.env`:

```bash
SPA_DIR='/home/vaschools-marhub/htdocs/marhub.vaschools.edu.vn/current/static'
```

### Đăng nhập Google lỗi `redirect_uri_mismatch`

Thêm `https://marhub.vaschools.edu.vn/auth/google/callback` vào **Authorized
redirect URIs** trong Google Cloud Console. Phải khớp từng ký tự, kể cả `https`
và không có dấu `/` ở cuối.

### Đăng nhập xong bị đá về trang login

Cookie session không được giữ. Kiểm tra:

| Nguyên nhân | Kiểm tra |
|---|---|
| `SECRET_KEY` vừa đổi | Session cũ mất hiệu lực — đăng nhập lại là xong |
| `ENVIRONMENT` không phải `production` | Cookie `https_only` sai cấu hình |
| `FRONTEND_URL` ≠ `BACKEND_URL` | Hai giá trị phải giống nhau (same-origin) |

### SERP trả 429 `SERP_MONTHLY_CAP`

Đã dùng hết trần request SerpAPI của tháng. Đây là **phanh có chủ đích**, không
phải lỗi.

```bash
[server] redis-cli -n 3 get serp:requests:$(date +%Y-%m)
```

Xử lý: chờ sang tháng (bộ đếm theo key tháng, tự reset), hoặc tăng
`MONTHLY_SERP_REQUEST_CAP` trong `shared/.env` rồi restart — cân nhắc chi phí
trước khi tăng.

### Hết dung lượng đĩa

```bash
[server] df -h
[server] du -sh $SITE/releases/*
[server] sudo du -sh /home/vaschools-marhub/logs/*
```

Release cũ được dọn tự động (giữ 5). Log đã có logrotate. Nếu vẫn đầy, thủ phạm
thường là site khác trên cùng VPS.

---

## Phần G — Những điều tuyệt đối tránh

| Không bao giờ | Vì sao |
|---|---|
| `rsync --delete` với đích là `htdocs/marhub.vaschools.edu.vn/` | Sẽ xoá `releases/`, `shared/`, `current`. **Đã từng xảy ra** — mất venv và `.env`. Chỉ `--delete` vào thư mục con cụ thể |
| Sửa vhost nginx thủ công | CloudPanel ghi đè khi site thay đổi qua UI |
| Commit `.env` | Chứa `SECRET_KEY`, mật khẩu DB, API key |
| Copy `index.html` ra document root | nginx sẽ phục vụ nó và SPA fallback cho deep route sẽ hỏng |
| Dùng Redis db 0 | Trộn key với site khác; `FLUSHDB` của họ xoá dữ liệu của mình |
| Chạy service dưới quyền `root` | Unit đã cấu hình `vaschools-marhub`, giữ nguyên |
| Sửa code trực tiếp trong `releases/` | Lần deploy sau sẽ mất. Sửa ở repo rồi deploy |
| Bỏ qua bước đồng bộ asset khi rollback | Trang trắng do hash file JS không khớp |
