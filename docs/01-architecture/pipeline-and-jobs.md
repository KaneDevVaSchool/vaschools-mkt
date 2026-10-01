# Pipeline & Jobs

## Vì sao cần hàng đợi

Ba ràng buộc buộc phải có queue ngay từ tuần 1, không thể thêm sau:

1. **Giới hạn 100 từ khóa/request** của SERP API — 2.000 từ khóa = 20 request,
   không làm thủ công được.
2. **Quota có chi phí thật** — một vòng lặp lỗi có thể đốt hết ngân sách tháng.
3. **Crawl định kỳ** — Rank Tracking cần snapshot theo lịch, không theo thao
   tác người dùng.

Nguyên tắc: **request của người dùng không bao giờ gọi API ngoài.** Người dùng
đọc từ DB; job nền lấp đầy DB.

## Danh sách job

| Job | Lịch | Đầu vào | Đầu ra | Module |
|---|---|---|---|---|
| `expand_seed_keywords` | thủ công / hàng tháng | seed list | `keywords` (ứng viên) | N1 |
| `fetch_serp_batch` | hàng ngày + theo yêu cầu | ≤100 keyword_id | `serp_snapshots` | N1, N2, N4 |
| `fetch_keyword_metrics` | hàng tuần | ≤ giới hạn provider | `keyword_metrics_raw` | N1 |
| `classify_intent` | sau khi có keyword mới | keyword chưa có nhãn | `keywords.intent` | N1 |
| `compute_rankings` | sau `fetch_serp_batch` | snapshot mới | `rankings` | N1 |
| `detect_competitors` | hàng tuần | snapshot toàn bộ | `competitor_candidates` | N1, N2 |
| `estimate_traffic` | hàng ngày | rankings + volume + CTR | `traffic_estimates` | N1, N2 |
| `fetch_backlinks` | hàng tuần | danh sách domain | `backlinks_raw` | N2 |
| `crawl_competitor_pages` | hàng tháng | 3–5 URL/đối thủ | `crawl_pages` | N2 |
| `site_audit_crawl` | hàng tuần | domain VAS | `crawl_pages`, `audit_issues` | N3 |
| `fetch_pagespeed` | hàng tuần | URL ưu tiên | `psi_raw` | N3 |
| `sync_ga4` | hàng ngày | property VAS | `ga4_raw` | N1, N4 |
| `calibrate_ctr_model` | hàng tháng | ga4_raw + rankings | `ctr_curves` | N1 |
| `generate_ideas` | theo yêu cầu | URL + payload hợp nhất | `onpage_ideas` (pending) | N4 |

## Thiết kế `fetch_serp_batch`

Job trung tâm, phục vụ 6 tính năng. Đặc tả chi tiết:

```
Đầu vào : keyword_ids (≤ 100), search_engine, location, language, device
Bước 1  : Kiểm tra cache — bỏ keyword đã có snapshot tươi
          (tier ưu tiên: < 1 ngày · tier thường: < 7 ngày)
Bước 2  : Kiểm tra quota — nếu tháng này đã đạt trần → dừng, ghi log, cảnh báo
Bước 3  : Gọi adapter theo lô, tôn trọng rate limit provider
Bước 4  : Ghi serp_snapshots (append-only, có fetched_at + provider + raw JSONB)
Bước 5  : Kích hoạt compute_rankings cho các domain đang theo dõi
```

Quy tắc bắt buộc:

| Quy tắc | Chi tiết |
|---|---|
| **Idempotent** | Chạy lại cùng đầu vào không tạo bản ghi trùng — khóa theo `(keyword_id, engine, location, device, DATE(fetched_at))` |
| **Append-only** | Không bao giờ UPDATE snapshot cũ. Lịch sử là tài sản của Rank Tracking |
| **Lưu raw JSONB** | Giữ nguyên response gốc. Đổi cách parse sau này không cần crawl lại |
| **Retry có backoff** | 3 lần, backoff mũ. Lỗi 4xx (trừ 429) không retry |
| **Quota guard trước khi gọi** | Kiểm tra trước, không phải sau |
| **Lỗi một phần không hỏng cả lô** | 100 keyword, 3 lỗi → ghi 97, đánh dấu 3 để thử lại |

## Phân tầng tần suất crawl

| Tier | Tiêu chí | Tần suất | Ước tính số lượng |
|---|---|---|---|
| `priority` | Từ khóa VAS đang theo dõi thứ hạng | Hàng ngày | ~100–300 |
| `standard` | Từ khóa trong bộ nghiên cứu | Hàng tuần | ~1.000–3.000 |
| `archive` | Đã crawl, không theo dõi chủ động | Theo yêu cầu | phần còn lại |

Phân tầng là cơ chế kiểm soát chi phí chính. Xem
[scheduling-and-quota.md](../07-ops/scheduling-and-quota.md).

## Chuỗi phụ thuộc

```
expand_seed_keywords
      │
      ├──► fetch_keyword_metrics ──┐
      │                            │
      └──► fetch_serp_batch ───────┼──► compute_rankings
                  │                │          │
                  │                └──────────┼──► estimate_traffic
                  │                           │          │
                  └──► detect_competitors ────┘          │
                                                         ▼
sync_ga4 ──► calibrate_ctr_model ──────────────────► (cập nhật CTR)

site_audit_crawl ──┐
fetch_pagespeed ───┼──► generate_ideas  (N4)
fetch_backlinks ───┘
```

`generate_ideas` chạy **theo yêu cầu**, không theo lịch — vì tốn chi phí LLM và
kết quả cần người duyệt.

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Provider trả 429 | Backoff, retry, giảm tốc độ toàn worker |
| Provider trả 5xx | Retry 3 lần, sau đó đánh dấu `failed`, job khác vẫn chạy |
| Provider đổi format response | Adapter raise `ProviderSchemaError`, dừng job đó, cảnh báo — **không** ghi dữ liệu méo |
| Đạt trần quota | Dừng mọi job tiêu quota, giữ nguyên job chỉ đọc DB, gửi cảnh báo |
| Trang trả JS rỗng khi crawl | Fallback Playwright, đánh dấu `render_mode=js` |
| LLM trả JSON sai schema | Retry 1 lần với thông báo lỗi; vẫn sai → lưu `failed`, không hiển thị |

## Quan sát được

Mỗi lần chạy job ghi một bản ghi `job_runs`:

```
job_name · started_at · finished_at · status
items_requested · items_succeeded · items_failed
api_requests_made · estimated_cost_usd · error_summary
```

Bảng này là cơ sở cho theo dõi chi phí ([monitoring.md](../07-ops/monitoring.md))
và để trả lời câu hỏi "số này crawl lúc nào" khi trình bày báo cáo.
