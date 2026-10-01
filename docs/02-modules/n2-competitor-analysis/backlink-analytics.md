# Backlink Analytics

**Phân loại: Buy bắt buộc.** Đây là tính năng duy nhất trong toàn dự án không
thể giải quyết bằng phương pháp Hybrid.

## Vì sao không thể tự build

Phát hiện backlink mới ở quy mô toàn cầu đòi hỏi bot crawl **toàn internet
liên tục** — một domain bất kỳ trên thế giới có thể đặt link trỏ về VAS hoặc
đối thủ, và không có cách nào biết trước nó ở đâu.

Đây là hạ tầng nhiều năm và nhiều triệu đô của Ahrefs/SEMrush/Majestic. Không
có đường tắt, không có phương án Hybrid.

**Quyết định: Buy. Không tranh luận lại.**

## Phạm vi sử dụng

Backlink data phục vụ 3 nơi:

| Nơi dùng | Chỉ số cần |
|---|---|
| N1 Domain Overview (VAS) | Tổng backlink, referring domains, Authority Score |
| N2 Compare Domains | Cùng các chỉ số, cho 5–10 đối thủ |
| N4 Backlink Ideas | Danh sách referring domain của đối thủ mà VAS chưa có |

N4 là nơi dữ liệu này tạo giá trị hành động: "đối thủ có link từ 40 trang mà
VAS chưa có — đây là danh sách cần tiếp cận".

## Chọn nhà cung cấp

Cần chốt **trước tuần 3**. Tiêu chí đánh giá:

| Tiêu chí | Vì sao quan trọng |
|---|---|
| Độ phủ domain `.vn` và `.edu.vn` | Ngành giáo dục VN — index quốc tế mạnh không đủ |
| Có sẵn Authority Score | Nếu không, phải tự tính, khó so sánh với SEMrush |
| API (không chỉ giao diện web) | Cần tự động hóa |
| Giới hạn số domain/tháng | Phạm vi chỉ 5–10 domain → gói nhỏ đủ dùng |
| Cho phép lấy danh sách referring domain | Cần cho N4 Backlink Ideas |
| Giá theo quy mô nhỏ | Không cần gói enterprise |

Ứng viên: DataForSEO Backlinks API (nếu đã dùng DataForSEO cho SERP thì gộp
được hợp đồng), Ahrefs API, Majestic API.

Ưu tiên gộp cùng nhà cung cấp SERP nếu chất lượng chấp nhận được — giảm một
đầu mối hợp đồng và một adapter.

## Chỉ số lưu trữ

| Chỉ số | Nhãn | Ghi chú |
|---|---|---|
| `total_backlinks` | `VENDOR` | Tổng số link |
| `referring_domains` | `VENDOR` | Số domain khác nhau — thường có ý nghĩa hơn tổng |
| `authority_score` | `VENDOR` | Nếu provider có |
| `dofollow_ratio` | `VENDOR` | — |
| `new_lost_backlinks` | `VENDOR` | Theo kỳ, nếu provider hỗ trợ |
| `top_referring_domains` | `VENDOR` | Danh sách, cần cho N4 |
| `anchor_text_distribution` | `VENDOR` | Nếu có |

Mọi chỉ số nhãn `VENDOR` — hiển thị gần nguyên bản, không tính lại. Đây là
điều khiến module này đơn giản nhất về mặt code, dù đắt nhất về chi phí.

## Adapter

```python
# providers/backlinks/base.py
class BacklinkProvider(Protocol):
    async def get_domain_metrics(self, domain: str) -> DomainBacklinkMetrics: ...
    async def get_referring_domains(self, domain: str,
                                     limit: int = 100) -> list[ReferringDomain]: ...
```

Bắt buộc có `fake.py` trả dữ liệu cố định, để phát triển và test N4 không cần
chờ hợp đồng. Đây là cách N4 Backlink Ideas không bị chặn nếu hợp đồng chậm.

## Job

```
fetch_backlinks   — hàng tuần, cho mọi domain đang theo dõi
```

Backlink thay đổi chậm hơn SERP nhiều — hàng tuần là đủ, hàng ngày lãng phí
quota.

## Endpoint

```
GET /api/v1/competitors/{domain}/backlinks
GET /api/v1/competitors/{domain}/referring-domains?page=1
GET /api/v1/competitors/backlink-gap?our=vaschools.edu.vn&theirs=competitor-a.edu.vn
```

Endpoint cuối (backlink gap) là đầu vào trực tiếp cho N4 Backlink Ideas: trả
về referring domain đối thủ có mà VAS không có.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Hợp đồng chưa ký | Dùng `fake.py`, UI hiện "Đang tích hợp" — **không chặn module khác** |
| Provider không có Authority Score | Tự tính, ghi rõ là điểm nội bộ — xem [compare-domains.md](compare-domains.md) |
| Domain mới, provider chưa index | `null` + "Nhà cung cấp chưa có dữ liệu" |
| Quota provider hết | Giữ dữ liệu cũ, đánh dấu `is_stale` |

## Nghiệm thu

- [ ] Adapter có `fake.py`, N4 phát triển được khi chưa có hợp đồng
- [ ] Mọi chỉ số nhãn `VENDOR`, không tính lại
- [ ] Backlink gap endpoint hoạt động, sẵn sàng cho N4
- [ ] Đổi nhà cung cấp chỉ cần thêm một class
