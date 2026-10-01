# Phát hiện đối thủ tự động

Tìm domain cạnh tranh với VAS dựa trên mức trùng lặp SERP (competitor overlap).

**Phân loại**: Hybrid — dùng SERP data đã có, tự xây logic lọc domain đối thủ
thật và loại bỏ domain nhiễu (báo, mạng xã hội, wiki).

> **Rủi ro đã biết**: danh sách tự động có thể lẫn domain không liên quan. Bắt
> buộc có bước duyệt thủ công trước khi đưa vào báo cáo.

## Nguyên lý

Hai domain cạnh tranh nếu cùng xuất hiện trên SERP của nhiều từ khóa giống nhau.

```
Với mỗi từ khóa VAS đang xếp hạng (Top 100):
    lấy mọi domain khác cũng xuất hiện trong Top 20
    → đếm số từ khóa trùng, tính điểm theo vị trí
```

## Công thức điểm

`analytics/competitor_detector.py`, hàm thuần.

```python
overlap_score(domain) =
      Σ (trên từ khóa chung)  w(vị_trí_VAS) × w(vị_trí_họ) × log(1 + volume)

w(vị trí) = 1 / log2(vị_trí + 1)      # vị trí cao đóng góp nhiều hơn
```

Chuẩn hóa về 0–100 theo domain điểm cao nhất.

Vì sao nhân với `log(1+volume)`: một domain trùng VAS ở 50 từ khóa đuôi dài
ít cạnh tranh hơn một domain trùng ở 10 từ khóa volume lớn.

Ngưỡng: chỉ xét domain có `chung >= 5 từ khóa` **và** `overlap_score >= 10`.
Dưới ngưỡng là nhiễu thống kê.

## Lọc domain nhiễu — phần quan trọng nhất

Bộ lọc nhiều tầng, chạy theo thứ tự:

### Tầng 1 — Danh sách loại trừ cứng

```python
EXCLUDED_DOMAINS = {
    # Mạng xã hội
    "facebook.com", "youtube.com", "tiktok.com", "instagram.com",
    "linkedin.com", "twitter.com", "x.com", "pinterest.com", "zalo.me",
    # Wiki / từ điển
    "wikipedia.org", "wiktionary.org", "vi.wikipedia.org",
    # Báo / tin tổng hợp VN
    "vnexpress.net", "tuoitre.vn", "thanhnien.vn", "dantri.com.vn",
    "vietnamnet.vn", "zingnews.vn", "kenh14.vn", "24h.com.vn",
    "laodong.vn", "nld.com.vn", "baomoi.com", "vtv.vn", "vov.vn",
    # Diễn đàn / hỏi đáp
    "webtretho.com", "otofun.net", "reddit.com", "quora.com",
    # Thương mại điện tử
    "shopee.vn", "lazada.vn", "tiki.vn",
    # Cổng thông tin chính phủ
    "moet.gov.vn", "chinhphu.vn",
    # Tổng hợp / rao vặt
    "chotot.com", "batdongsan.com.vn",
}
```

Lưu ở `analytics/blocklist.py`, bổ sung dần. Không hardcode rải rác.

### Tầng 2 — Quy tắc heuristic

| Quy tắc | Lý do |
|---|---|
| Loại domain có TLD không phải VN/giáo dục và không có nội dung tiếng Việt | Kết quả quốc tế lẫn vào |
| Loại domain chỉ xuất hiện ở từ khóa `informational` thuần | Trang tin, không cạnh tranh tuyển sinh |
| Loại domain xuất hiện ở > 80% mọi từ khóa | Dấu hiệu trang tổng hợp, không phải đối thủ cụ thể |
| Loại subdomain của chính VAS | — |

### Tầng 3 — Tín hiệu tích cực (tăng điểm tin cậy)

| Tín hiệu | Ý nghĩa |
|---|---|
| TLD `.edu.vn` | Nhiều khả năng là trường học |
| Trùng ở từ khóa `commercial`/`transactional` | Cạnh tranh tuyển sinh thật |
| Có trang học phí / chương trình / tuyển sinh | Cùng mô hình kinh doanh |

Domain vượt cả 3 tầng nhận `confidence: high`; chỉ qua tầng 1–2 nhận
`confidence: medium`.

### Tầng 4 — Duyệt thủ công (bắt buộc)

Mọi domain phát hiện tự động vào trạng thái **`pending_review`**. Chỉ domain
đã duyệt (`approved`) mới:

- Xuất hiện trong báo cáo gửi MarHub.
- Được đưa vào N2 Compare Domains.
- Được crawl nội dung (tránh tốn tài nguyên vào domain sai).

UI cho phép duyệt/từ chối hàng loạt. Domain bị từ chối tự động thêm vào
blocklist cá nhân hóa của dự án.

## Endpoint

```
GET  /api/v1/domains/{domain}/competitors?status=pending|approved|rejected
POST /api/v1/competitors/{id}/review    body: {"status": "approved"|"rejected"}
```

```json
{
  "data": [{
    "domain": "competitor-a.edu.vn",
    "overlap_score":    { "value": 78, "provenance": "ESTIMATED" },
    "common_keywords":  { "value": 142, "provenance": "OBSERVED" },
    "avg_position":     { "value": 8.4, "provenance": "OBSERVED" },
    "confidence": "high",
    "signals": [".edu.vn", "trùng ở 89 từ khóa thương mại", "có trang học phí"],
    "review_status": "pending_review",
    "sample_keywords": ["trường quốc tế tphcm", "học phí song ngữ"]
  }]
}
```

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Danh sách xếp theo overlap_score | Cao → thấp |
| Mỗi dòng | Domain · điểm · số từ khóa chung · vị trí TB · confidence |
| Cột tín hiệu | Hiện vì sao domain này được coi là đối thủ |
| Từ khóa mẫu | 3–5 từ khóa chung, click xem SERP |
| Nút duyệt / từ chối | Từng dòng + chọn nhiều |
| Tab trạng thái | Chờ duyệt / Đã duyệt / Đã từ chối |
| Banner | "Danh sách tự động, cần duyệt trước khi dùng trong báo cáo" |

## Edge case

| Tình huống | Xử lý |
|---|---|
| VAS xếp hạng rất ít từ khóa | Ít dữ liệu để so trùng — cảnh báo độ tin cậy thấp |
| Đối thủ đã biết không xuất hiện | Cho phép **thêm domain thủ công** vào danh sách theo dõi. Bắt buộc có tính năng này |
| Domain dùng nhiều subdomain | Gộp theo registrable domain |
| Trường cùng hệ thống VAS | Thêm vào blocklist dự án |
| Domain mới xuất hiện | Đánh dấu `new`, ưu tiên hiện đầu danh sách chờ duyệt |

## Nghiệm thu

- [ ] Domain báo/MXH/wiki không lọt vào danh sách chờ duyệt
- [ ] Đối thủ đã biết (danh sách Marketing cung cấp) đều được phát hiện
- [ ] Thêm domain thủ công được
- [ ] Domain chưa duyệt không xuất hiện trong báo cáo hay N2
- [ ] Mỗi domain hiện rõ tín hiệu vì sao được chọn
