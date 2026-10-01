# Quy ước API

REST JSON, FastAPI, prefix `/api/v1`. OpenAPI schema tự sinh tại `/api/docs`.

## Nguyên tắc

| Nguyên tắc | Lý do |
|---|---|
| Endpoint **không bao giờ** gọi API ngoài | Một request người dùng không được đốt quota — xem [pipeline-and-jobs.md](pipeline-and-jobs.md) |
| Mọi số liệu trả về dạng object có `provenance` | [data-provenance.md](data-provenance.md) |
| Ghi luôn trả `202 Accepted` + `job_id` | Thao tác nặng chạy nền |
| Phân trang bắt buộc cho mọi list | Không có endpoint trả về danh sách không giới hạn |

## Định dạng số liệu

Mọi chỉ số là object, không phải số trần:

```json
{
  "search_volume": { "value": 2400, "provenance": "VENDOR" },
  "position":      { "value": 7,    "provenance": "OBSERVED" },
  "traffic_value": {
    "value": 1850000,
    "unit": "VND",
    "provenance": "ESTIMATED",
    "note": "Volume × CTR(vị trí) × CPC. Không thay thế GA4."
  },
  "keyword_difficulty": { "value": null, "provenance": "VENDOR",
                          "note": "Không có trong gói hiện tại" }
}
```

`value: null` + `note` là cách biểu diễn "không có dữ liệu". **Không bao giờ
thay bằng 0 hoặc số tự ước lượng.**

## Bao ngoài response

Danh sách:

```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "per_page": 50, "total": 1234, "total_pages": 25 },
  "meta": { "data_fetched_at": "2026-09-28T02:00:00Z", "is_stale": false }
}
```

`meta.data_fetched_at` là thời điểm crawl gần nhất của dữ liệu nền — bắt buộc,
vì "số này cũ chưa" là câu hỏi thường trực khi trình bày báo cáo.
`is_stale = true` khi vượt ngưỡng tươi của tier tương ứng.

Đối tượng đơn:

```json
{ "data": { ... }, "meta": { ... } }
```

## Lỗi

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Đã đạt trần quota SERP API tháng này.",
    "details": { "cap": 5000, "used": 5000, "resets_at": "2026-10-01T00:00:00Z" }
  }
}
```

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input sai định dạng |
| 400 | `TOO_MANY_KEYWORDS` | Vượt 100 từ khóa/request |
| 404 | `NOT_FOUND` | — |
| 409 | `JOB_ALREADY_RUNNING` | Job trùng đang chạy |
| 422 | `NO_DATA_YET` | Chưa crawl lần nào — gợi ý chạy job |
| 429 | `RATE_LIMITED` | Giới hạn phía app |
| 503 | `QUOTA_EXCEEDED` | Đạt trần quota tháng |
| 503 | `PROVIDER_UNAVAILABLE` | Nhà cung cấp lỗi |

Message hướng tới người dùng viết **tiếng Việt**; `code` giữ tiếng Anh để code
xử lý.

## Bảng endpoint

### N1 — Keyword & Organic

| Method | Path | Mô tả |
|---|---|---|
| POST | `/keywords/overview` | Tra ≤100 từ khóa. Body: `{"keywords": [...]}`. Vượt → `TOO_MANY_KEYWORDS` |
| GET | `/keywords/{id}` | Chi tiết một từ khóa |
| GET | `/keywords/{id}/serp` | SERP Simulation |
| GET | `/keywords/{id}/history` | Lịch sử vị trí |
| POST | `/keywords/magic` | Keyword Magic Tool. Body: `{"seed": "...", "match_type": "broad\|phrase\|exact\|related", "intent": [...]}` |
| POST | `/keywords/strategy` | Strategy Builder. Body: `{"keywords": [...]}` (≤5) |
| GET | `/domains/{domain}/overview` | Domain Overview |
| GET | `/domains/{domain}/organic-keywords` | Organic Ranking, tab Position |
| GET | `/domains/{domain}/competitors` | Đối thủ phát hiện tự động |

### N2 — Đối thủ

| Method | Path | Mô tả |
|---|---|---|
| POST | `/competitors/compare` | Compare Domains. Body: `{"domains": [...]}` (≤10) |
| GET | `/competitors/{domain}/traffic` | Traffic ước tính + % branded |
| GET | `/competitors/{domain}/backlinks` | Backlink profile |
| POST | `/competitors/content-gap` | Body: `{"our_url": "...", "competitor_urls": [...]}` |

### N3 — Site Audit

| Method | Path | Mô tả |
|---|---|---|
| POST | `/audits` | Khởi tạo audit → `202` + `job_id` |
| GET | `/audits/{id}` | Tổng quan: Site Health, đếm theo mức độ |
| GET | `/audits/{id}/issues` | Danh sách lỗi, lọc theo `severity`, `check_id` |
| GET | `/audits/{id}/pages` | Danh sách URL đã crawl |
| GET | `/audits/{id}/core-web-vitals` | CWV theo URL |
| GET | `/checks` | Danh mục lỗi + nội dung giải thích |

### N4 — On-page Checker

| Method | Path | Mô tả |
|---|---|---|
| POST | `/onpage/analyze` | Body: `{"url": "...", "target_keywords": [...]}` → `202` |
| GET | `/onpage/{id}` | 7 nhóm ý tưởng |
| GET | `/onpage/priority-pages` | Trang ưu tiên + ước tính traffic tăng thêm |
| POST | `/onpage/ideas/{idea_id}/review` | Duyệt. Body: `{"status": "approved\|rejected", "note": "..."}` |

### Admin

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/jobs` | Trạng thái job gần đây |
| POST | `/admin/jobs/{name}/run` | Chạy thủ công |
| GET | `/admin/quota` | Quota đã dùng / trần / chi phí ước tính |

## Xác thực

Nội bộ VAS. MVP: API key theo header `X-API-Key`, hoặc tích hợp SSO sẵn có nếu
có. Không mở public — dữ liệu đối thủ và chi phí API đều nhạy cảm.

## Versioning

Prefix `/v1` cố định. Thay đổi phá vỡ tương thích → `/v2`, không sửa `/v1` tại
chỗ. Thêm trường mới không tính là phá vỡ.
