# Google PageSpeed Insights API

**Phân loại: Buy** (miễn phí). Nguồn Core Web Vitals cho N3 và N4 UX Ideas.

**Độ chính xác gần như 100%** — cùng nguồn dữ liệu Google dùng để xếp hạng.
Không tự tính lại. Nhãn `VENDOR`.

## Endpoint

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
    ?url={url}&strategy=mobile&category=performance&key={API_KEY}
```

## Field data vs Lab data

Điểm dễ nhầm nhất — xem
[core-web-vitals.md](../02-modules/n3-site-audit/core-web-vitals.md) cho chi
tiết. Tóm tắt: ưu tiên `loadingExperience` (field, CrUX, người dùng thật);
chỉ rơi về `lighthouseResult` (lab) khi trang không đủ lưu lượng, và phải ghi
rõ `data_source`.

## Quota

| Giới hạn | Giá trị |
|---|---|
| Không có API key | 1 request / phút — không dùng được |
| Có API key | 25.000 request/ngày, 240/phút |

API key miễn phí từ Google Cloud Console. Luôn dùng key.

Quota rộng so với nhu cầu (20–50 URL/tuần), nên quota không phải ràng buộc.
Ràng buộc thật là **thời gian**: mỗi request mất 10–30 giây.

## Hiệu năng

```
50 URL × 2 thiết bị × ~20s = ~33 phút nếu tuần tự
```

Chạy song song 5 request là hợp lý (dưới giới hạn 240/phút, không quá tải).

## Trích xuất

```python
{
  "data_source": "field" if loadingExperience else "lab",
  "lcp_ms": ..., "inp_ms": ..., "cls": ...,
  "performance_score": int(lighthouseResult.categories.performance.score * 100),
  "opportunities": [...]   # từ lighthouseResult.audits
}
```

Giữ nguyên `raw` — PSI trả rất nhiều thông tin chẩn đoán (opportunities,
diagnostics) mà N4 UX Ideas sẽ dùng, dù MVP chưa parse hết.

## Opportunities đáng quan tâm

Ánh xạ sang gợi ý UX trong N4:

| Audit ID | Gợi ý tiếng Việt |
|---|---|
| `render-blocking-resources` | Hoãn tải CSS/JS chặn hiển thị |
| `unused-css-rules` | Loại bỏ CSS không dùng |
| `modern-image-formats` | Chuyển ảnh sang WebP/AVIF |
| `uses-responsive-images` | Dùng ảnh đúng kích thước hiển thị |
| `server-response-time` | Giảm thời gian phản hồi máy chủ |
| `unminified-javascript` | Nén JavaScript |

## Biến môi trường

```
PAGESPEED_API_KEY=
PAGESPEED_STRATEGY=mobile      # mặc định mobile-first
PAGESPEED_MAX_URLS=50
PAGESPEED_CONCURRENCY=5
```

## Edge case

| Tình huống | Xử lý |
|---|---|
| Trang không đủ lưu lượng CrUX | `data_source: "lab"`, ghi rõ trên UI |
| PSI timeout (> 60s) | Retry 2 lần, sau đó `failed` — không chặn audit |
| Trang trả 4xx/5xx | Bỏ qua, đã có check riêng |
| Trang chặn Google bot | Ghi lỗi rõ ràng |
| Lighthouse lỗi nội bộ | Ghi `raw`, đánh dấu partial |

## Nghiệm thu

- [ ] Dùng API key, không chạy không key
- [ ] Ưu tiên field data, ghi rõ khi rơi về lab
- [ ] Mặc định mobile
- [ ] Giữ raw response đầy đủ
- [ ] Timeout không làm hỏng cả audit
- [ ] Opportunities parse được, sẵn cho N4
