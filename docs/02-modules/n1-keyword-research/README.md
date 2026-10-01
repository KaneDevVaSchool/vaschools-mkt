# N1 — Nghiên cứu từ khóa & Organic Research

## Yêu cầu gốc từ MarHub

| Tính năng | Nội dung chính |
|---|---|
| **Keyword Overview** | Tra cứu tối đa 100 từ khóa/lần: volume, KD%, intent, CPC, trend; xem chi tiết từng từ khóa |
| **Keyword Magic Tool** | Mở rộng & phân nhánh từ khóa gốc theo 4 loại match (Broad/Phrase/Exact/Related); phân loại intent I/N/C/T |
| **Keyword Strategy Builder** | Nhập tối đa 5 từ khóa, tự động nhóm theo mô hình Pillar Page / Cluster Content; gợi ý triển khai bài viết SEO |
| **Domain Overview** | Organic Search, Paid Search, Backlinks, Traffic Analytics, Top Keywords/Pages, Competitors, Authority Score, AI Search |
| **Organic Ranking** | Đánh giá thứ hạng tổng thể website; tab Position: từ khóa, intent, vị trí SERP, thay đổi vị trí, đối thủ cùng phân khúc |

## Đặc tả chi tiết

| File | Nội dung |
|---|---|
| [keyword-overview.md](keyword-overview.md) | Tra cứu 100 từ khóa/lần, các chỉ số hiển thị |
| [keyword-magic-tool.md](keyword-magic-tool.md) | Thuật toán mở rộng + 4 match type |
| [keyword-strategy-builder.md](keyword-strategy-builder.md) | Pillar/Cluster + gợi ý bài viết |
| [rank-tracking.md](rank-tracking.md) | Lịch sử vị trí theo thời gian |
| [organic-research.md](organic-research.md) | Organic Keywords/Traffic/Traffic Value cho VAS |
| [competitor-detection.md](competitor-detection.md) | Phát hiện đối thủ tự động + lọc nhiễu |
| [domain-overview.md](domain-overview.md) | Trang tổng hợp theo domain |

## Sơ đồ dữ liệu của module

```
seed keywords (thủ công + GSC + menu đối thủ)
        │
        ▼
Google Suggest ─────► mở rộng ─────► keywords
                                        │
        ┌───────────────────────────────┼──────────────────┐
        ▼                               ▼                  ▼
Keyword Planner              SERP API (Top 100)         LLM
volume/CPC/density            serp_snapshots           intent
        │                               │                  │
        └───────────────┬───────────────┴──────────────────┘
                        ▼
                 keyword_metrics (hợp nhất)
                        │
        ┌───────────────┼───────────────┬──────────────────┐
        ▼               ▼               ▼                  ▼
Keyword Overview   Rank Tracking   Organic Research   Competitor
                                   + Traffic Value     Detection
```

## Phạm vi MVP

**Có**: Keyword Overview, Keyword Magic Tool, Match Type filter, Intent (I/N/C/T),
Rank Tracking, Organic Keywords/Traffic/Traffic Value, phát hiện đối thủ tự động,
Domain Overview (phần Organic + Backlink tái dùng từ N2).

**Optional**: KD% — chỉ khi gói provider có sẵn với chi phí hợp lý. Nếu không,
hiển thị `null` + note, dùng Results/Competition thay thế. **Không blocker.**

**Ngoài MVP**: AI Search (Phase 2), Paid Search intelligence, Keyword Strategy
Builder có thể cắt nếu chậm tiến độ (mục 3 trong thứ tự cắt giảm).

## Phụ thuộc

| Cần | Từ đâu | Chặn gì |
|---|---|---|
| SERP API hoạt động | [serp-api.md](../../04-integrations/serp-api.md) | Gần như toàn bộ module |
| Tài khoản Google Ads active | [keyword-planner.md](../../04-integrations/keyword-planner.md) | Volume/CPC chính xác |
| Bảng CTR | [ctr-model.md](../../03-data/ctr-model.md) | Traffic estimate, Traffic Value |
| GA4 | [ga4.md](../../04-integrations/ga4.md) | Hiệu chỉnh CTR (không chặn MVP) |
| Backlink provider | N2 | Phần Backlink/Authority trong Domain Overview |

## Độ chính xác cam kết

Xem [accuracy-and-risks.md](../../00-overview/accuracy-and-risks.md). Tóm tắt:
Rank Tracking ~95%+, Results/Competition cao, Search Volume 70–85%, KD% không
khả thi tự làm.
