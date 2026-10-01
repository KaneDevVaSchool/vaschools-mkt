# Google Analytics 4

**Phân loại: Build** (dữ liệu nội bộ VAS, miễn phí). Nhãn `MEASURED` — nguồn
tin cậy cao nhất trong hệ thống.

## Ba vai trò

| Vai trò | Module | Vì sao quan trọng |
|---|---|---|
| **Hiệu chỉnh mô hình CTR** | N1 → dùng chung toàn hệ thống | Hiệu chỉnh một lần, mọi ước tính tốt lên |
| **Đối chiếu Organic Research** | N1 | Đặt số ước tính cạnh số thật để không ai đọc nhầm |
| **Tín hiệu UX Ideas** | N4 | Bounce rate, engagement time |

Vai trò đầu là có giá trị nhất: nó cải thiện cả ước tính traffic đối thủ ở N2,
dù dữ liệu chỉ có của VAS.

## Chỉ có dữ liệu của VAS

Không có GA4 của đối thủ — đó chính là lý do tồn tại của toàn bộ mô hình ước
tính. Với domain đối thủ, khối GA4 đơn giản là không hiển thị.

## Dữ liệu cần lấy

```python
# GA4 Data API — runReport
dimensions = ["date", "landingPagePlusQueryString", "sessionDefaultChannelGroup"]
metrics    = ["sessions", "bounceRate", "averageSessionDuration",
              "engagementRate", "screenPageViews"]
filter     = sessionDefaultChannelGroup == "Organic Search"
```

Lấy theo ngày, gộp theo tháng khi dùng. Lưu vào `ga4_raw`.

## Hạn chế của GA4 cho mục đích này

| Hạn chế | Ảnh hưởng |
|---|---|
| **Không có dữ liệu từ khóa** | GA4 chỉ cho landing page, không cho query. Hiệu chỉnh CTR phải ghép qua URL, không phải qua từ khóa |
| Data sampling ở tập lớn | Với quy mô VAS thường không vấn đề |
| Chênh lệch định nghĩa session | GA4 đếm session khác cách ta hiểu "lượt truy cập" |
| Độ trễ 24–48 giờ | Không dùng cho phân tích thời gian thực |

Hạn chế đầu quan trọng nhất và định hình cách hiệu chỉnh: ta ghép
`(landing page, tháng)` với vị trí trung bình của các từ khóa trỏ về URL đó.
Đây là phép ghép gián tiếp, kém chính xác hơn ghép trực tiếp theo từ khóa.

## Google Search Console — nên có

GSC bù đúng hạn chế trên: nó **có** dữ liệu theo từ khóa (query, impressions,
clicks, vị trí trung bình).

| Dùng GSC để | Giá trị |
|---|---|
| Nạp từ khóa vào bộ nền | Tăng độ phủ Organic Research đáng kể |
| Hiệu chỉnh CTR theo từ khóa | Chính xác hơn nhiều so với ghép qua URL |
| Đối chiếu vị trí ta crawl với vị trí GSC báo | Kiểm chứng Rank Tracking |

**Khuyến nghị mạnh: tích hợp GSC song song với GA4.** Chi phí thấp (API miễn
phí, tương tự GA4), giá trị cao. Tài liệu gốc không nêu GSC như một hạng mục
riêng, nhưng nó giải quyết trực tiếp ba giới hạn đã biết.

Nếu phải chọn một: GSC có giá trị hơn GA4 cho mục đích SEO.

## Xác thực

Service account + quyền Viewer trên GA4 property:

```
GA4_PROPERTY_ID=
GA4_CREDENTIALS_JSON=/path/to/service-account.json
GSC_SITE_URL=https://vaschools.edu.vn/
```

File credentials không commit vào repo.

## Job

```
sync_ga4            — hàng ngày (dữ liệu hôm qua)
calibrate_ctr_model — hàng tháng
```

## Edge case

| Tình huống | Xử lý |
|---|---|
| Chưa có quyền truy cập | Bỏ khối so sánh, `calibrated=false`, banner cảnh báo mạnh hơn |
| Dữ liệu lịch sử < 3 tháng | Không hiệu chỉnh CTR, giữ v1 |
| Sampling được áp dụng | Ghi rõ trong metadata |
| Landing page có query string | Chuẩn hóa URL trước khi ghép |
| Dữ liệu ngày gần nhất chưa đủ | Bỏ 2 ngày gần nhất khi tính |

## Nghiệm thu

- [ ] Lấy được organic sessions theo landing page
- [ ] Ghép được với rankings qua URL đã chuẩn hóa
- [ ] Không có GA4 thì hệ thống vẫn chạy, chỉ mất hiệu chỉnh
- [ ] Số GA4 luôn nhãn `MEASURED`, hiển thị cạnh số ước tính
- [ ] Đánh giá tích hợp GSC trong tuần 3
