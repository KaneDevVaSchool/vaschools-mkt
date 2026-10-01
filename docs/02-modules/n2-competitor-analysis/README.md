# N2 — Phân tích đối thủ cạnh tranh

## Yêu cầu gốc từ MarHub

| Tính năng | Nội dung chính |
|---|---|
| **Compare Domains** | So sánh nhiều website cùng lúc: Organic Keywords, Organic Traffic, Paid Keywords/Traffic, Backlinks, Authority Score, Traffic Cost |

Mở rộng theo bảng phân loại: Backlink đối thủ, Traffic ước tính đối thủ,
% lưu lượng thương hiệu/không thương hiệu, On-page Competitive Content Signal.

## Đặc tả chi tiết

| File | Nội dung |
|---|---|
| [compare-domains.md](compare-domains.md) | Bảng so sánh tổng hợp nhiều domain |
| [traffic-estimation.md](traffic-estimation.md) | Mô hình ước tính traffic đối thủ |
| [branded-traffic.md](branded-traffic.md) | Gắn nhãn branded / non-branded |
| [backlink-analytics.md](backlink-analytics.md) | Backlink (Buy bắt buộc) |
| [content-gap.md](content-gap.md) | On-page Competitive Content Signal |

## Điểm mấu chốt: N2 gần như miễn phí sau N1

Traffic ước tính đối thủ dùng **cùng một `serp_snapshots`** đã crawl cho N1,
chỉ đổi bộ lọc domain:

```
serp_snapshots  ──┬──► lọc domain = vaschools.edu.vn   → N1 Organic Research
                  └──► lọc domain = đối thủ            → N2 Traffic ước tính
```

Cùng mô hình CTR, cùng công thức. Hệ quả tích cực ngoài chi phí: VAS và đối
thủ được đo bằng **đúng một thước đo**, nên so sánh tương đối đáng tin hơn
nhiều so với độ chính xác tuyệt đối của từng con số.

Khoản chi thật sự mới của N2 chỉ là **Backlink Database**.

## Phạm vi

**5–10 domain đối thủ.** Không phải index toàn ngành. Quy mô này là lý do
kiến trúc Hybrid đủ dùng — xem
[accuracy-and-risks.md](../../00-overview/accuracy-and-risks.md) mục N2.

Domain đưa vào N2 phải là domain đã **duyệt** ở
[competitor-detection.md](../n1-keyword-research/competitor-detection.md),
hoặc thêm thủ công bởi Marketing.

## Phân loại

| Tính năng con | Loại | Phần tự Build |
|---|---|---|
| Backlink của đối thủ | **Buy bắt buộc** | Không có — không thể tự crawl toàn internet |
| Traffic ước tính (5–10 domain) | Hybrid | Mô hình CTR theo vị trí, tổng hợp theo domain |
| % branded / non-branded | Hybrid | Tự gắn nhãn theo từ khóa |
| Compare Domains | Hybrid | Tổng hợp nhiều nguồn, tự tính Authority Score / Traffic Cost |
| On-page Content Signal | Hybrid | Tự crawl 3–5 trang public + LLM so sánh |

## Cảnh báo bắt buộc

> **Số liệu đối thủ là ƯỚC TÍNH, không phải số liệu thật.** Chỉ dùng để so
> sánh xu hướng tương đối (đối thủ nào lớn hơn, đang tăng hay giảm). **Không
> dùng cho quyết định tài chính hoặc ngân sách lớn.**

Độ chính xác với phương án MVP (SERP API + Keyword Planner): **70–85%**.

## Phụ thuộc

| Cần | Từ đâu | Chặn gì |
|---|---|---|
| `serp_snapshots` có dữ liệu | N1 tuần 2 | Toàn bộ traffic ước tính |
| Bảng CTR | [ctr-model.md](../../03-data/ctr-model.md) | Traffic ước tính |
| Danh sách đối thủ đã duyệt | N1 competitor-detection | Phạm vi module |
| Backlink provider | Hợp đồng — chốt trước tuần 3 | Backlink, Authority Score |
| Playwright | Hạ tầng | Crawl trang đối thủ render JS |
