# N4 — On-page Checker

Tổng hợp 7 nhóm gợi ý SEO on-page, dùng dữ liệu nền từ N1–N3.

## Yêu cầu gốc từ MarHub

Tổng quan số lượng ý tưởng SEO on-page, ước tính traffic tăng thêm nếu tối ưu,
danh sách trang ưu tiên. 7 nhóm gợi ý: Strategy, Backlink, Technical SEO,
Content, UX (cần GA4), Semantic, SERP Features.

## Đặc tả chi tiết

| File | Nội dung |
|---|---|
| [idea-groups.md](idea-groups.md) | Đặc tả 7 nhóm, nguồn dữ liệu, cách sinh |
| [data-aggregation.md](data-aggregation.md) | Chuẩn hóa payload từ 4 module nền |
| [prioritization.md](prioritization.md) | Ước tính tác động, xếp hạng trang ưu tiên |
| [review-mechanism.md](review-mechanism.md) | Quy trình duyệt của con người |

## 7 nhóm và phân loại

| Nhóm | Module nền | Loại | Điểm module (tham khảo) |
|---|---|---|---|
| **Technical SEO** | Site Audit (N3) | **Build** | 4,50 |
| **User Experience (UX)** | PageSpeed (N3) + GA4 | Hybrid | 5,00 / 5,00 |
| **Semantic** | Keyword Magic Tool (N1) | Hybrid | 4,75 |
| **Content** | Keyword Research (N1) + Content Gap (N2) + LLM | Hybrid | 3,25–4,25 |
| **SERP Features** | SERP crawl (N1) | Hybrid | 3,25 (cốt lõi) |
| **Backlink** | Backlink Analytics (N2, Buy) | Hybrid | 3,25 (cốt lõi) |
| **Strategy** | Tổng hợp cả 6 nhóm bằng LLM | Hybrid | phụ thuộc toàn hệ thống |

## Quan hệ phụ thuộc — KHÔNG block toàn bộ

> N4 sử dụng dữ liệu nền từ N1, N2, N3. Đây **không** phải quan hệ block toàn
> bộ — nếu một module chưa hoàn thiện 100%, N4 vẫn phát triển và ra mắt theo
> từng phần. Nhóm ý tưởng nào có đủ dữ liệu nền sẽ triển khai trước.

Thứ tự khả thi thực tế:

```
Sẵn sàng sớm nhất  ──────────────────────────►  Cần nhiều nền nhất

Technical          UX          Semantic    SERP Feat.  Content   Strategy
(chỉ cần N3)   (N3+GA4)      (chỉ cần N1)  (chỉ N1)   (N1+N2)  (cả 6 nhóm)
```

Technical Ideas chỉ cần N3 — làm được ngay tuần 5, không chờ gì.
Strategy Ideas cần cả 6 nhóm — tuần 7, không thể sớm hơn.

Nếu Backlink provider chậm hợp đồng, 6 nhóm còn lại vẫn chạy; nhóm Backlink
dùng `fake.py` để phát triển và bật lên khi có dữ liệu thật.

## Kiến trúc 6 bước

Theo tài liệu gốc:

| Bước | Nội dung | Nguồn |
|---|---|---|
| 1. Thu thập đầu vào | Với mỗi URL: lỗi kỹ thuật (N3), backlink (N2), từ khóa/ngữ nghĩa (N1), SERP Top 10, GA4 | 4 module |
| 2. Chuẩn hóa cho AI | Gộp thành 1 payload có cấu trúc nhất quán/URL | Nội bộ — [data-aggregation.md](data-aggregation.md) |
| 3. Sinh gợi ý 6 nhóm | Prompt riêng từng nhóm, đối chiếu Top 10 SERP | LLM + dữ liệu |
| 4. Sinh gợi ý Chiến lược | Prompt tổng hợp, tham chiếu 6 nhóm trên | LLM, phức tạp nhất |
| 5. Duyệt của con người | Chuyên gia SEO rà soát trước khi hiển thị | Quy trình — [review-mechanism.md](review-mechanism.md) |
| 6. Dashboard | 7 nhóm theo từng trang, ưu tiên theo tác động | React |

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| **Strategy là nhóm rủi ro cao nhất** — chất lượng phụ thuộc hoàn toàn vào prompt và khả năng tổng hợp của model | BẮT BUỘC chuyên gia SEO/Marketing duyệt. **Không tự động hóa hoàn toàn** |
| **Hallucination — gợi ý sai kỹ thuật SEO** — có thể xảy ra ở **bất kỳ nhóm nào** | Cơ chế duyệt cho **cả 7 nhóm**, không chỉ Strategy |
| **Phụ thuộc chất lượng 4 module nền** | Nếu module nền thiếu sót, gợi ý ở đây bị ảnh hưởng theo. Hiển thị rõ nguồn dữ liệu của từng gợi ý |
| **Nhóm Backlink và SERP Features kế thừa giới hạn index** | Index nhỏ hơn SEMrush/Ahrefs — có thể bỏ sót cơ hội |
| Hiển thị quá nhiều gợi ý gây rối | Ưu tiên hóa theo tác động, mặc định chỉ hiện top N |

## Nguyên tắc bất di bất dịch

1. **LLM không sinh số liệu.** Mọi con số trong gợi ý lấy từ DB, chèn vào
   payload. Xem [llm-usage-policy.md](../../05-llm/llm-usage-policy.md).
2. **Mọi gợi ý mặc định `pending_review`.** Cả 7 nhóm, không ngoại lệ.
3. **Mỗi gợi ý phải dẫn được về dữ liệu nguồn.** Gợi ý không chứng minh được
   là gợi ý không dùng được.
