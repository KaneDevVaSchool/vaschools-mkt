# Backlink Provider

**Phân loại: Buy bắt buộc.** Xem
[backlink-analytics.md](../02-modules/n2-competitor-analysis/backlink-analytics.md)
cho đặc tả module. File này chỉ bàn phần tích hợp.

## Trạng thái quyết định

**Chưa chốt nhà cung cấp. Cần chốt trước tuần 3.**

Đây là hạng mục duy nhất trong dự án chưa có phương án dự phòng kỹ thuật —
không tự build được, không thay thế bằng Hybrid.

## Ứng viên

| Provider | Ưu | Nhược |
|---|---|---|
| **DataForSEO Backlinks** | Gộp hợp đồng với SERP API; giá theo mức dùng | Index nhỏ hơn Ahrefs |
| **Ahrefs API** | Index lớn nhất, có Domain Rating | Đắt, gói API thường yêu cầu tier cao |
| **Majestic API** | Có Trust Flow / Citation Flow, giá hợp lý | Không có Authority Score tương đương |

**Khuyến nghị: DataForSEO** nếu đã chọn họ cho SERP — một hợp đồng, một
adapter, một hóa đơn. Với phạm vi 5–10 domain, chênh lệch index không đáng kể.

## Tiêu chí đánh giá khi có báo giá

| Tiêu chí | Ngưỡng chấp nhận |
|---|---|
| Độ phủ domain `.vn` / `.edu.vn` | Kiểm tra bằng thử nghiệm trên vaschools.edu.vn và 2 đối thủ |
| Có Authority Score sẵn | Nếu không, phải tự tính — ghi rõ là điểm nội bộ |
| Lấy được danh sách referring domain | **Bắt buộc** — cần cho N4 Backlink Ideas |
| Số domain/tháng trong gói | ≥ 15 (10 đối thủ + VAS + biên) |
| Có API, không chỉ web UI | Bắt buộc |

Tiêu chí thứ nhất nên kiểm chứng bằng trial trước khi ký: index quốc tế mạnh
không đảm bảo phủ tốt domain giáo dục Việt Nam.

## Interface

```python
class BacklinkProvider(Protocol):
    async def get_domain_metrics(self, domain: str) -> DomainBacklinkMetrics: ...
    async def get_referring_domains(self, domain: str,
                                     limit: int = 100) -> list[ReferringDomain]: ...
    async def get_backlink_gap(self, our: str,
                                theirs: list[str]) -> list[ReferringDomain]: ...
```

Nếu provider không có endpoint gap, adapter tự tính bằng phép hiệu tập hợp
trên hai lời gọi `get_referring_domains`.

## Không bị chặn bởi hợp đồng

`providers/backlinks/fake.py` cho phép:

- N2 Compare Domains hiển thị cột backlink (dữ liệu giả, ghi rõ).
- N4 Backlink Ideas phát triển và test đầy đủ.
- UI hoàn thiện trước khi có dữ liệu thật.

Khi hợp đồng ký, đổi env là xong. **Không để hợp đồng chậm chặn tiến độ.**

## Tần suất

```
fetch_backlinks — hàng tuần
```

Backlink thay đổi chậm hơn SERP nhiều. Hàng tuần đủ; hàng ngày lãng phí quota
mà số gần như không đổi.

## Biến môi trường

```
BACKLINK_PROVIDER=fake          # fake | dataforseo | ahrefs | majestic
BACKLINK_API_KEY=
BACKLINK_MONTHLY_DOMAIN_CAP=15
```

## Nghiệm thu

- [ ] Chốt nhà cung cấp trước tuần 3
- [ ] Kiểm chứng độ phủ `.edu.vn` bằng trial trước khi ký
- [ ] `fake.py` đủ để phát triển N2 và N4
- [ ] Lấy được danh sách referring domain (cần cho N4)
- [ ] Đổi provider chỉ cần thêm một class
