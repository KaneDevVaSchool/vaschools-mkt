# Kiến trúc tổng thể

## Sơ đồ khối

```
┌─────────────────────── NGUỒN NGOÀI ────────────────────────┐
│  SERP API      Google Ads      PSI API    Backlink DB  GA4 │
│  (Buy)         Keyword Planner (Buy)      (Buy)        (nội bộ)
└──────┬──────────────┬─────────────┬──────────┬─────────┬───┘
       │              │             │          │         │
       ▼              ▼             ▼          ▼         ▼
┌────────────────────────────────────────────────────────────┐
│  LỚP ADAPTER PROVIDER  (providers/)                        │
│  Mỗi nguồn = 1 interface + N implementation                │
│  → Đổi nhà cung cấp = thêm 1 class, không sửa nghiệp vụ    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  INGESTION  (jobs/)  — Celery workers                      │
│  batch 100 kw/request · retry · rate limit · quota guard   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  RAW STORE  (PostgreSQL)                                   │
│  serp_snapshots · keyword_metrics_raw · backlinks_raw      │
│  psi_raw · ga4_raw · crawl_pages                           │
│  ⚠ Bất biến. Không sửa. Mỗi bản ghi có provider + fetched_at│
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  DERIVED / ANALYTICS  (analytics/)  — hàm thuần            │
│  ctr_model · traffic_estimator · competitor_detector       │
│  match_type_filter · cluster_builder · audit_rules         │
│  ⚠ Mọi output mang provenance = ESTIMATED                  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  LLM LAYER  (llm/)                                         │
│  intent_classifier · content_gap · 7 idea generators       │
│  ⚠ Output luôn ở trạng thái pending_review                 │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  API  (api/)  — FastAPI, REST JSON                         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  FRONTEND  (React + TypeScript)                            │
│  N1 Keyword · N2 Competitor · N3 Site Audit · N4 On-page   │
└────────────────────────────────────────────────────────────┘
```

## Bốn tầng, bốn quy tắc

| Tầng | Được phép | Cấm |
|---|---|---|
| **Adapter** | Gọi HTTP ra ngoài, chuẩn hóa response về model nội bộ | Chứa logic nghiệp vụ, tính toán dẫn xuất |
| **Raw store** | Ghi một lần, đọc nhiều lần | Sửa/ghi đè bản ghi đã có (chỉ thêm version mới) |
| **Derived** | Hàm thuần: raw vào → số liệu ra | Gọi HTTP ra ngoài, ghi vào raw store |
| **LLM** | Sinh văn bản gợi ý từ payload đã chuẩn hóa | Sinh **số liệu**; xem [llm-usage-policy.md](../05-llm/llm-usage-policy.md) |

Quy tắc quan trọng nhất: **LLM không bao giờ sinh ra con số.** Mọi số liệu đến
từ tầng adapter (đo được) hoặc tầng derived (tính được và tái lập được).

## Luồng dữ liệu dùng chung — vì sao nén được 7 tuần

Một lần crawl SERP phục vụ **6 tính năng**:

```
serp_snapshots (crawl Top 100 một lần)
   ├─► Keyword Overview           (N1) — hiển thị kết quả
   ├─► SERP Simulation            (N1) — hiển thị lại thô
   ├─► Results / Competition      (N1) — đếm từ response
   ├─► Rank Tracking              (N1) — lọc theo domain VAS + lịch sử
   ├─► Traffic ước tính đối thủ   (N2) — lọc theo domain đối thủ + CTR
   └─► SERP Features Ideas        (N4) — đối thủ chiếm feature nào
```

Hệ quả thiết kế: **không được tạo bảng SERP riêng cho từng module.** Mọi module
đọc chung `serp_snapshots`.

## Phụ thuộc giữa các module

```
       ┌──────────────────────────────┐
       │  Hạ tầng SERP + Volume + CTR │   Tuần 1–2
       └───────┬──────────────┬───────┘
               │              │
        ┌──────▼─────┐  ┌─────▼──────┐
        │ N1 Keyword │  │ N2 Đối thủ │   Tuần 2–3
        │ + Organic  │  │ + Backlink │
        └──────┬─────┘  └─────┬──────┘
               │              │
        ┌──────▼──────┐       │
        │ N3 Site     │       │           Tuần 4–5
        │ Audit + PSI │       │
        └──────┬──────┘       │
               │              │
            ┌──▼──────────────▼──┐
            │ N4 On-page Checker │              Tuần 6–7
            │  (7 nhóm ý tưởng)  │
            └────────────────────┘
```

N4 phụ thuộc **từng phần**, không block toàn bộ: nhóm ý tưởng nào đủ dữ liệu
nền thì triển khai trước. Ví dụ Technical Ideas chỉ cần N3, làm được ngay khi
N3 xong mà không chờ N2.

## Quyết định kiến trúc then chốt

| Quyết định | Lý do | Hệ quả nếu bỏ qua |
|---|---|---|
| Raw store bất biến, tách khỏi derived | Đổi mô hình CTR → tính lại toàn bộ lịch sử mà không crawl lại | Đổi công thức = mất dữ liệu cũ hoặc phải đốt quota crawl lại |
| Mọi provider đi qua adapter | Giá/điều khoản SERP API có thể thay đổi | Đổi nhà cung cấp = viết lại nghiệp vụ |
| Provenance gắn ở tầng dữ liệu, không ở tầng UI | Nhãn không thể bị quên khi thêm màn hình mới | Lãnh đạo đọc nhầm số ước tính thành số thật |
| Derived là hàm thuần | Test được bằng fixture, không cần gọi API | Không test được, không tái lập được kết quả |
| LLM output mặc định `pending_review` | Bắt buộc có người duyệt | Gợi ý sai kỹ thuật lọt tới người dùng cuối |
| Một `serp_snapshots` dùng chung | Nén timeline, giảm chi phí API | Chi phí API nhân 6 lần |
