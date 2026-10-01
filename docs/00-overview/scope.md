# Phạm vi dự án

## Mục tiêu

Xây dựng nền tảng SEO/Marketing Intelligence nội bộ cho VA Schools, đáp ứng 4
nhu cầu MarHub đặt ra, với chi phí vận hành thấp hơn đáng kể so với thuê bao
SEMrush Guru / Ahrefs Standard ($199–249/tháng).

Phạm vi phân tích: **vaschools.edu.vn + 5–10 domain đối thủ đã biết**, ngành
giáo dục. Đây không phải sản phẩm SEO đa ngành quy mô toàn cầu.

## 4 nhu cầu

| Mã | Tên | Gồm |
|---|---|---|
| N1 | Nghiên cứu từ khóa & Organic Research | Keyword Overview, Keyword Magic Tool, Keyword Strategy Builder, Domain Overview, Organic Ranking |
| N2 | Phân tích đối thủ cạnh tranh | Compare Domains, Backlink, Traffic ước tính đối thủ, On-page Competitive Content Signal |
| N3 | Site Audit (Technical SEO) | Site Health, Errors/Warnings/Notices, Core Web Vitals, Crawlability, Internal Linking |
| N4 | On-page Checker | 7 nhóm ý tưởng: Strategy, Backlink, Technical, Content, UX, Semantic, SERP Features |

Quan hệ phụ thuộc: **N4 tiêu thụ dữ liệu nền từ N1, N2, N3.** Đây không phải
quan hệ block toàn bộ — nhóm ý tưởng nào đủ dữ liệu nền thì triển khai trước.

```
N1 (keyword + SERP + organic)  ─┐
N2 (competitor + backlink)     ─┼──►  N4 (on-page checker)
N3 (site audit + PSI)          ─┘
```

## Trong MVP 7 tuần

- N1: Keyword Overview, Keyword Magic Tool, Match Type filter, Intent
  classification, Rank Tracking, Organic Keywords/Traffic/Traffic Value cho
  vaschools.edu.vn, phát hiện đối thủ tự động.
- N2: Compare Domains (5–10 domain), Traffic ước tính, % branded/non-branded,
  Backlink (dữ liệu mua), On-page Content Gap.
- N3: Crawl phát hiện lỗi, phân loại Errors/Warnings/Notices, Core Web Vitals
  qua PSI, nội dung giải thích lỗi + hướng dẫn sửa, AI Search readiness mức
  rule-based cơ bản.
- N4: 7 nhóm ý tưởng, ưu tiên hóa theo impact, cơ chế duyệt của con người.
- Keyword Strategy Builder (Pillar/Cluster + gợi ý bài viết).

## Ngoài MVP — Phase 2

| Hạng mục | Lý do hoãn |
|---|---|
| **AI Search** (AI Visibility, Mentions, Cited Pages) | Chưa có đặc tả nguồn dữ liệu / model / thang điểm trong tài liệu gốc. Cần khảo sát riêng nhiều AI model (ChatGPT, Gemini, Google AI Mode) và tự thiết kế scoring. Không đưa vào 7 tuần. |
| **Keyword Difficulty (KD%)** | Tự tính chỉ đạt ~30–50% tin cậy vì không có dữ liệu backlink của top 10 kết quả. **Quyết định**: mua nếu gói provider có sẵn với chi phí hợp lý; nếu không, hiển thị rõ "không có" và dùng *Results/Competition* thay thế. **Không để làm blocker.** |
| **Paid Search / Ads intelligence** | Tài liệu gốc chỉ liệt kê trong Domain Overview, không có đặc tả chi tiết. |
| Mở rộng ngoài ngành giáo dục | Bộ seed keyword và bộ lọc đối thủ đang thiết kế riêng cho giáo dục. |

## Điều kiện tiên quyết (phải có trước Tuần 1)

| Điều kiện | Vì sao chặn | Ai lo |
|---|---|---|
| Tài khoản Google Ads **đang chạy chiến dịch** | Keyword Planner chỉ trả Volume/CPC dạng khoảng ước lượng thô nếu tài khoản không active | Marketing |
| Hợp đồng/ngân sách SERP API (~$50–200/tháng) | Toàn bộ N1, N2 phụ thuộc | Ban lãnh đạo |
| Quyền truy cập GA4 property vaschools.edu.vn | Hiệu chỉnh mô hình CTR, nhóm ý tưởng UX | Marketing |
| Tối thiểu 3–6 tháng dữ liệu GA4 lịch sử | Hiệu chỉnh CTR mới có ý nghĩa thống kê | — (kiểm tra sớm) |
| Danh sách 5–10 domain đối thủ chốt | Phạm vi N2 | Marketing |
| 1 chuyên gia SEO cam kết thời gian duyệt nội dung | N3 (giải thích lỗi), N4 (7 nhóm ý tưởng) | Marketing |

Nếu thiếu tài khoản Ads active: vẫn triển khai được, nhưng Search Volume và CPC
phải gắn nhãn `ƯỚC LƯỢNG THÔ` và không dùng cho quyết định ngân sách.
