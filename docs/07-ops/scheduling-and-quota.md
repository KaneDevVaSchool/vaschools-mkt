# Lịch chạy & Kiểm soát quota

> **Rủi ro**: "Chi phí API liên tục — đây là kiến trúc Hybrid, cần trả phí
> liên tục cho SERP/Volume API."

Kiểm soát quota là cách giữ chi phí trong ngân sách mà không cần theo dõi thủ
công.

## Lịch chạy

| Job | Lịch (giờ VN) | Tiêu quota |
|---|---|---|
| `fetch_serp_batch` (tier priority) | 02:00 hàng ngày | **Có — nhiều nhất** |
| `fetch_serp_batch` (tier standard) | 03:00 Chủ nhật | **Có** |
| `compute_rankings` | Sau mỗi `fetch_serp_batch` | Không |
| `fetch_keyword_metrics` | 04:00 thứ Hai | Có |
| `classify_intent` | 05:00, khi có keyword mới | Có (LLM, rẻ) |
| `estimate_traffic` | 06:00 hàng ngày | Không |
| `detect_competitors` | 07:00 thứ Hai | Không |
| `fetch_backlinks` | 04:00 thứ Ba | Có |
| `sync_ga4` | 08:00 hàng ngày | Không (miễn phí) |
| `calibrate_ctr_model` | 09:00 ngày 1 hàng tháng | Không |
| `site_audit_crawl` | 01:00 thứ Bảy | Không |
| `fetch_pagespeed` | 03:00 thứ Bảy | Không (miễn phí, có quota rộng) |
| `crawl_competitor_pages` | 02:00 ngày 1 hàng tháng | Không |
| `generate_ideas` | **Theo yêu cầu** | Có (LLM) |
| `expand_seed_keywords` | Thủ công / hàng tháng | Có |

Nguyên tắc xếp lịch: job tiêu quota chạy đêm; job tính toán chạy sau job thu
thập; job crawl nặng chạy cuối tuần.

## Phân tầng — cơ chế kiểm soát chi phí chính

| Tier | Tiêu chí | Tần suất | Số lượng | SERP/tháng |
|---|---|---|---|---|
| `priority` | Từ khóa đang theo dõi thứ hạng | Hàng ngày | 100–300 | ~6.000 |
| `standard` | Bộ nghiên cứu | Hàng tuần | 1.000–3.000 | ~9.200 |
| `archive` | Không theo dõi chủ động | Theo yêu cầu | còn lại | ~0 |

Chuyển tier là cách điều chỉnh chi phí nhanh nhất: giảm 100 từ khóa khỏi
`priority` tiết kiệm ~3.000 request/tháng.

## Quota guard

Kiểm tra **trước** mỗi lời gọi provider, không phải sau:

```python
async def check_quota(provider: str, estimated_requests: int) -> None:
    usage = await get_monthly_usage(provider)
    if usage.requests_used + estimated_requests > usage.requests_cap:
        raise ProviderQuotaExceeded(...)
```

Hành vi khi đạt trần:

| Mức | Hành động |
|---|---|
| 80% | Cảnh báo, job vẫn chạy |
| 95% | Cảnh báo khẩn, tạm dừng tier `standard` |
| 100% | **Dừng mọi job tiêu quota.** Job chỉ đọc DB vẫn chạy |

Ở mức 100%, ứng dụng vẫn hoạt động đầy đủ với dữ liệu đã có — chỉ ngừng cập
nhật. UI hiển thị `is_stale` trên dữ liệu cũ.

## Cache — giảm chi phí trước khi cần trần

| Loại | Ngưỡng tươi | Tiết kiệm |
|---|---|---|
| SERP tier `priority` | 1 ngày | — |
| SERP tier `standard` | 7 ngày | Lớn |
| SERP tier `archive` | 30 ngày | Lớn |
| Keyword metrics | 30 ngày | Lớn — volume đổi chậm |
| Backlinks | 7 ngày | — |
| PageSpeed | 7 ngày | — |
| LLM (theo `payload_hash`) | Không hết hạn | **Rất lớn** |

Cache LLM theo hash payload đáng chú ý: chạy lại phân tích một URL không đổi
là miễn phí. Điều này khiến người dùng thoải mái bấm "phân tích lại".

## Theo dõi chi phí

Mỗi job ghi vào `job_runs`:

```
api_requests_made · estimated_cost_usd
```

Bảng `quota_usage` tổng hợp theo tháng và provider.

```
GET /api/v1/admin/quota
```

```json
{
  "serp": { "used": 12400, "cap": 20000, "pct": 62,
            "cost_usd": 124.00, "resets_at": "2026-10-01" },
  "llm":  { "cost_usd": 18.40 },
  "projected_month_end": { "cost_usd": 198.00,
                           "note": "Theo tốc độ hiện tại" }
}
```

`projected_month_end` quan trọng hơn con số đã dùng: nó cho biết **sẽ** vượt
ngân sách hay không, khi còn kịp điều chỉnh.

## Đối chiếu hóa đơn

Cuối mỗi tháng: so `estimated_cost_usd` tích lũy với hóa đơn thật. Sai lệch
> 20% → hiệu chỉnh hàm `estimate_cost` trong adapter (Gate 7).

Tháng đầu tiên gần như chắc chắn lệch — đó là mục đích của việc đo.

## Điều chỉnh khi vượt ngân sách

Theo thứ tự, ít ảnh hưởng nhất trước:

```
1. Tăng ngưỡng cache tier standard (7 → 14 ngày)
2. Giảm số từ khóa tier priority
3. Chuyển tier priority từ hàng ngày sang 2 ngày/lần
4. Giảm depth SERP từ 100 xuống 50   ← ảnh hưởng Rank Tracking
5. Bỏ crawl mobile cho tier priority
```

Bước 4 và 5 ảnh hưởng chất lượng — chỉ dùng khi 1–3 không đủ, và phải ghi rõ
trên UI.

## Nghiệm thu

- [ ] Quota guard kiểm tra trước khi gọi, có test
- [ ] Đạt 100% trần thì dừng, ứng dụng vẫn chạy với dữ liệu cũ
- [ ] Cache theo tier hoạt động
- [ ] Cache LLM theo `payload_hash` hoạt động
- [ ] `projected_month_end` tính đúng
- [ ] Chỉ một instance `beat` chạy
