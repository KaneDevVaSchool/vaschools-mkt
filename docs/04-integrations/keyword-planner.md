# Google Keyword Planner (Google Ads API)

**Phân loại: Buy** (miễn phí về tiền, nhưng có điều kiện bắt buộc).

Nguồn của Search Volume, CPC và Competitive Density.

## Điều kiện tiên quyết — rủi ro đã xác định

> **Google Keyword Planner cần tài khoản Google Ads đang chạy chiến dịch mới
> trả số liệu chính xác.** Nếu không, Search Volume và CPC chỉ là **khoảng
> ước lượng thô** (ví dụ "1K–10K" thay vì "2.400").

Tác động cụ thể:

| Tình trạng tài khoản | Volume trả về | Dùng được không |
|---|---|---|
| Đang chạy chiến dịch có chi tiêu | Số cụ thể | Có — độ chính xác 70–85% |
| Có tài khoản, không chi tiêu | Khoảng rộng ("1K–10K") | Chỉ để xếp thứ tự tương đối |
| Không có tài khoản | Không truy cập được API | Không |

**Kiểm tra ngay tuần 1.** Đây là điều kiện tiên quyết ghi trong
[scope.md](../00-overview/scope.md) — phát hiện muộn ở tuần 3 sẽ làm hỏng
Traffic Value và Compare Domains.

## Phương án dự phòng

Nếu không có tài khoản Ads active:

1. **Dùng Volume từ DataForSEO** thay thế (họ có nguồn riêng) — khuyến nghị.
2. Hiển thị khoảng thay vì số cụ thể, gắn nhãn rõ `ƯỚC LƯỢNG THÔ`.
3. Không dùng Traffic Value cho quyết định ngân sách.

Phương án 1 là lý do nên chọn DataForSEO cho SERP API — nó cũng giải quyết
rủi ro này.

## Dữ liệu lấy về

| Trường | Ghi chú |
|---|---|
| `avg_monthly_searches` | Trung bình 12 tháng |
| `monthly_search_volumes` | Chi tiết theo tháng — quan trọng vì ngành giáo dục có mùa vụ |
| `competition` | LOW/MEDIUM/HIGH |
| `competition_index` | 0–100 → chuẩn hóa về 0–1 |
| `low_top_of_page_bid` / `high_top_of_page_bid` | Micros → CPC |

CPC lưu là trung bình của low và high, đơn vị micros VND.

## Mùa vụ ngành giáo dục

`monthly_search_volumes` đáng lưu ý riêng: tìm kiếm về tuyển sinh tăng mạnh
theo mùa (thường tháng 3–7). Volume trung bình 12 tháng che mất điều này.

MVP: lưu và hiển thị trend, chưa áp dụng hệ số mùa vụ vào ước tính traffic.
Ghi rõ đây là giới hạn (xem
[traffic-estimation.md](../02-modules/n2-competitor-analysis/traffic-estimation.md)).

## Giới hạn API

| Giới hạn | Giá trị |
|---|---|
| Từ khóa/request | ~1.000 (rộng hơn SERP API nhiều) |
| Request/ngày | Theo tier tài khoản |
| Ngôn ngữ/địa điểm | Chỉ định rõ `vi` / Vietnam |

Vì giới hạn rộng, `fetch_keyword_metrics` chạy hàng tuần là đủ — volume thay
đổi chậm.

## Xác thực

OAuth2 với refresh token. Cần:

```
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
```

Developer token cần Google phê duyệt — nộp đơn sớm, có thể mất vài ngày.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Từ khóa volume quá thấp | Trả `null`, **không phải 0** |
| Tài khoản không active | Trả khoảng; adapter lưu cả `volume_min`/`volume_max` |
| Developer token chưa duyệt | Dùng `fake.py`, không chặn phát triển |
| Từ khóa không hợp lệ | Bỏ qua, ghi log, không làm hỏng cả lô |

## Nghiệm thu

- [ ] Kiểm tra tình trạng tài khoản Ads trong tuần 1, ghi lại kết quả
- [ ] Volume `null` khi không có dữ liệu, không phải 0
- [ ] Lưu `monthly_search_volumes` đầy đủ
- [ ] CPC lưu dạng micros, không float
- [ ] Có phương án dự phòng nếu tài khoản không active
