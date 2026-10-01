# Compare Domains

So sánh nhiều website cùng lúc trên một bảng.

**Phân loại**: Hybrid — tổng hợp Backlink (Buy) + Traffic ước tính (Hybrid)
vào một bảng, tự tính Authority Score và Traffic Cost.

## Endpoint

```
POST /api/v1/competitors/compare
```

```json
{
  "domains": ["vaschools.edu.vn", "competitor-a.edu.vn", "competitor-b.edu.vn"],
  "period": "2026-09"
}
```

Ràng buộc: `len(domains) <= 10`. Domain phải đã duyệt hoặc là domain VAS.

## Các cột so sánh

| Cột | Nguồn | Nhãn | Ghi chú |
|---|---|---|---|
| Organic Keywords | `rankings` | `ESTIMATED` | Đếm từ khóa Top 100 trong bộ nền |
| Organic Traffic | traffic_estimator | `ESTIMATED` | Volume × CTR |
| Traffic Value | + CPC | `ESTIMATED` | — |
| Traffic Cost | + CPC | `ESTIMATED` | Chi phí nếu mua cùng lượng traffic bằng ads |
| Backlinks | Backlink provider | `VENDOR` | — |
| Referring Domains | Backlink provider | `VENDOR` | Thường có ý nghĩa hơn tổng backlink |
| Authority Score | Backlink provider hoặc tự tính | `VENDOR`/`ESTIMATED` | Xem mục dưới |
| % Branded | [branded-traffic.md](branded-traffic.md) | `ESTIMATED` | — |
| **Paid Keywords / Traffic** | — | — | **Ngoài MVP** — cột hiện `—` + note |

## Authority Score

Hai phương án, ưu tiên theo thứ tự:

1. **Lấy từ backlink provider** nếu gói có sẵn → nhãn `VENDOR`. Ưu tiên cách này.
2. **Tự tính** nếu không có → nhãn `ESTIMATED`, công thức phải công khai trong UI:

```
authority_score = normalize(
      0.45 × log(1 + referring_domains)
    + 0.25 × log(1 + total_backlinks)
    + 0.20 × organic_keywords_score
    + 0.10 × avg_position_score
) → thang 0–100
```

Nếu tự tính, **bắt buộc** ghi rõ trong UI: "Điểm nội bộ, không so sánh được
với Authority Score của SEMrush/Ahrefs". Hai thang điểm khác nhau mang cùng
tên là nguồn hiểu nhầm phổ biến.

## Traffic Cost

```
traffic_cost = Σ (trên mọi từ khóa domain xếp hạng)
                 organic_traffic(kw) × cpc(kw)
```

Ý nghĩa: số tiền phải trả nếu mua lượng traffic tương đương bằng Google Ads.
Đây là cách diễn đạt giá trị SEO dễ hiểu nhất với Ban lãnh đạo — nhưng vẫn là
`ESTIMATED`.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Bảng ngang | Domain theo cột, chỉ số theo hàng — dễ so sánh hơn domain theo hàng |
| Domain VAS | Highlight, luôn ở cột đầu |
| Mỗi ô | `<MetricCell>` có badge nhãn nguồn |
| Banner đầu bảng | "Số liệu ước tính, chỉ dùng so sánh tương đối. Không dùng cho quyết định tài chính." |
| Biểu đồ cột nhóm | So sánh trực quan từng chỉ số |
| Cột Paid Search | Hiện `—` + tooltip "Ngoài phạm vi MVP" |
| Export | CSV/PDF kèm chân trang cảnh báo |
| Chọn domain | Multi-select từ danh sách đã duyệt |

Không dùng màu xanh/đỏ kiểu "thắng/thua" cho số ước tính — dễ tạo cảm giác
chắc chắn hơn thực tế. Dùng thanh ngang so sánh độ lớn tương đối.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Domain chưa có dữ liệu backlink | Ô `null` + "Chưa lấy dữ liệu", không để trống |
| Domain mới thêm, chưa crawl SERP | Xếp job, hiện skeleton cột đó |
| Đối thủ không xếp hạng từ khóa nào trong bộ nền | Hiện 0 + giải thích độ phủ bộ nền |
| So sánh domain có quy mô rất chênh lệch | Biểu đồ dùng thang log, hoặc ghi rõ thang tuyến tính |
| Chỉ chọn 1 domain | Vẫn hiển thị, gợi ý thêm domain để so sánh |

## Nghiệm thu

- [ ] So sánh được tới 10 domain
- [ ] Mọi ô có nhãn nguồn; banner cảnh báo không ẩn được
- [ ] Authority Score ghi rõ là của provider hay tự tính
- [ ] Cột Paid Search hiện rõ là ngoài phạm vi
- [ ] VAS và đối thủ dùng **cùng một mô hình CTR** (kiểm chứng bằng test)
- [ ] Export có chân trang cảnh báo
