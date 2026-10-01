# SERP API

**Phân loại: Buy.** Nền dữ liệu quan trọng nhất — phục vụ N1, N2 và N4.

## Vai trò

Một lần crawl phục vụ 6 tính năng (xem
[system-overview.md](../01-architecture/system-overview.md)). Đây là khoản chi
định kỳ lớn nhất và là điểm phụ thuộc lớn nhất của toàn dự án.

## So sánh nhà cung cấp

| Tiêu chí | DataForSEO | SerpAPI |
|---|---|---|
| Giá / 1.000 SERP | Thấp hơn | Cao hơn |
| Có kèm Keyword Volume | Có (gói riêng) | Hạn chế |
| Có kèm Backlinks | **Có** | Không |
| Có Keyword Difficulty | Có (gói riêng) | Không |
| Độ phủ thị trường VN | Tốt | Tốt |
| Batch nhiều từ khóa/request | Có (100) | Hạn chế hơn |
| Độ trễ | Cao hơn (async queue) | Thấp hơn |

**Khuyến nghị: DataForSEO** — gộp được SERP + Volume + Backlink + (tùy chọn)
KD trong một hợp đồng. Giảm từ 3 đầu mối nhà cung cấp xuống 1, và có thể giải
quyết luôn khoản Buy bắt buộc của N2.

Quyết định cuối cùng phụ thuộc báo giá thực tế. Lớp adapter đảm bảo chọn sai
không phải thảm họa.

## Tham số crawl

| Tham số | Giá trị | Lý do |
|---|---|---|
| `location` | `Vietnam` / `Ho Chi Minh City` | Kết quả địa phương khác nhau đáng kể |
| `language` | `vi` | — |
| `device` | `desktop` + `mobile` | Google xếp hạng mobile-first; nhưng crawl cả hai nhân đôi chi phí — MVP ưu tiên `desktop`, `mobile` chỉ cho tier `priority` |
| `depth` | 100 | Top 100 — cần cho Rank Tracking |
| `se_domain` | `google.com.vn` | — |

Quyết định `device`: crawl cả hai cho mọi từ khóa là lãng phí. Mobile chỉ cho
tier `priority` là cân bằng hợp lý ở quy mô này.

## Giới hạn 100 từ khóa/request

Ràng buộc cứng, ảnh hưởng thiết kế:

- Job `fetch_serp_batch` nhận tối đa 100 keyword_id.
- API của ta cũng giới hạn 100 (`TOO_MANY_KEYWORDS`) — phản ánh thẳng để
  không tạo kỳ vọng sai.
- 2.500 từ khóa = 25 request/chu kỳ.

## Ước tính quota

```
Tier priority : 200 kw × 30 ngày = 6.000 SERP/tháng
Tier standard : 2.300 kw × 4 tuần = 9.200 SERP/tháng
                                   ─────────────────
                                   ~15.200 SERP/tháng
```

Cộng crawl theo yêu cầu. Đặt `MONTHLY_SERP_REQUEST_CAP` với biên 20%.

**Đo chi phí thật ngay tuần 1** — con số ở đây là ước lượng, không phải báo giá.

## Cache

| Tier | Ngưỡng tươi |
|---|---|
| `priority` | 1 ngày |
| `standard` | 7 ngày |
| `archive` | 30 ngày |

Job kiểm tra cache **trước** khi gọi. Đây là cơ chế giảm chi phí hiệu quả nhất.

## Xử lý bất đồng bộ

DataForSEO dùng mô hình queue: POST task → poll kết quả. Adapter che giấu
điều này — `fetch_serp` chờ và trả kết quả, job không cần biết.

Timeout: 5 phút/lô. Quá thì đánh dấu `failed`, retry ở chu kỳ sau.

## Biến môi trường

```
SERP_PROVIDER=dataforseo
SERP_API_LOGIN=
SERP_API_PASSWORD=
SERP_DEFAULT_LOCATION=Vietnam
SERP_DEFAULT_LANGUAGE=vi
MONTHLY_SERP_REQUEST_CAP=20000
```

## Nghiệm thu

- [ ] Adapter qua test contract chung
- [ ] Fixture ghi từ response thật, đủ đa dạng
- [ ] Cache theo tier hoạt động
- [ ] `estimate_cost` khớp hóa đơn thực tế (đối chiếu cuối tháng 1)
- [ ] Vượt trần quota thì dừng, không tiêu thêm
- [ ] Đo và ghi lại chi phí thật trong tuần 1
