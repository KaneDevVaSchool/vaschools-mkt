# Giám sát

Quy mô nội bộ, 1–2 dev. Giữ đơn giản: log có cấu trúc + cảnh báo qua email/
Slack, không dựng cả hệ thống observability.

## Ba câu hỏi cần trả lời được

1. **Job có chạy không?** — job im lặng thất bại là chế độ hỏng nguy hiểm
   nhất: dữ liệu cũ dần, UI vẫn hiển thị bình thường, không ai biết.
2. **Chi phí có trong ngân sách không?**
3. **Dữ liệu có tươi không?**

## Log có cấu trúc

JSON, một dòng một sự kiện:

```json
{"ts": "2026-09-28T02:00:00Z", "level": "info", "job": "fetch_serp_batch",
 "run_id": 1042, "event": "batch_completed",
 "items": 100, "succeeded": 97, "failed": 3,
 "api_requests": 1, "cost_usd": 0.01, "duration_s": 42.3}
```

Trường bắt buộc: `ts`, `level`, `job`/`endpoint`, `run_id`, `event`.

**Không bao giờ log API key.** Adapter phải che — kiểm tra trong code review.

## Cảnh báo

| Điều kiện | Mức | Kênh |
|---|---|---|
| Job thất bại 2 lần liên tiếp | Cảnh báo | Slack |
| Job không chạy đúng lịch (quá 2× chu kỳ) | Cảnh báo | Slack |
| Quota đạt 80% | Cảnh báo | Slack + email |
| Quota đạt 95% | Khẩn | Slack + email |
| `ProviderSchemaError` | **Khẩn** | Slack + email |
| `ProviderAuthError` | **Khẩn** | Slack + email |
| Tỷ lệ lỗi > 20% trong một lô | Cảnh báo | Slack |
| Site audit phát hiện lỗi `error` mới tăng > 50% | Thông tin | Slack |
| Chi phí dự phóng cuối tháng vượt ngân sách | Cảnh báo | Email |

Hai mục `Khẩn` đầu là dấu hiệu provider đổi thứ gì đó — cần người xử lý ngay,
không đợi sáng hôm sau.

Cảnh báo "job không chạy đúng lịch" quan trọng ngang cảnh báo lỗi: beat chết
âm thầm là sự cố hay gặp và khó phát hiện.

## Bảng theo dõi nội bộ

```
GET /api/v1/admin/jobs
GET /api/v1/admin/quota
GET /api/v1/admin/data-freshness
GET /api/v1/admin/review-stats
```

Màn hình admin hiển thị:

| Khối | Nội dung |
|---|---|
| Job gần đây | 20 lần chạy cuối, trạng thái, thời lượng, số lỗi |
| Quota | Đã dùng / trần / chi phí / dự phóng cuối tháng |
| Độ tươi dữ liệu | Lần crawl cuối theo từng loại dữ liệu |
| Chất lượng LLM | Tỷ lệ duyệt/từ chối theo nhóm và prompt version |

Khối cuối là cách theo dõi hiệu quả của tầng AI theo thời gian — xem
[human-review-workflow.md](../05-llm/human-review-workflow.md).

## Độ tươi dữ liệu

```json
{
  "serp_priority":  { "last_run": "2026-09-28T02:00Z", "age_hours": 6,
                      "expected_hours": 24, "status": "fresh" },
  "serp_standard":  { "age_hours": 72, "expected_hours": 168, "status": "fresh" },
  "backlinks":      { "age_hours": 400, "expected_hours": 168, "status": "stale" },
  "ga4":            { "age_hours": 12, "expected_hours": 24, "status": "fresh" }
}
```

Trường `status: "stale"` đẩy `is_stale: true` vào API response tương ứng, để
UI hiện banner. Người dùng luôn biết mình đang nhìn số cũ.

## Sức khỏe hệ thống

```
GET /health        → 200 nếu api + db + redis ổn
GET /health/deep   → thêm: kết nối provider, tồn đọng hàng đợi
```

`/health/deep` không gọi API tốn phí — chỉ kiểm tra cấu hình và kết nối.

## Lưu giữ log

| Loại | Giữ |
|---|---|
| Log ứng dụng | 30 ngày |
| `job_runs` | 12 tháng (để phân tích chi phí) |
| Log lỗi | 90 ngày |

## Việc định kỳ của người vận hành

| Việc | Tần suất |
|---|---|
| Xem bảng job + quota | Hàng tuần |
| Đối chiếu chi phí với hóa đơn | Hàng tháng |
| Xem tỷ lệ từ chối gợi ý LLM | Hàng tháng |
| Rà soát cảnh báo chưa xử lý | Hàng tuần |
| Chạy lại Validation Gate 1 và 2 | Hàng quý |

Mục cuối đáng làm: độ chính xác có thể trôi khi Google đổi thuật toán hoặc
provider đổi nguồn dữ liệu. Kiểm định một lần lúc bàn giao không đủ.
