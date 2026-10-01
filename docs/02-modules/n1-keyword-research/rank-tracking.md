# Rank Tracking

Theo dõi vị trí website trên SERP theo thời gian, tính xu hướng và biểu đồ.

**Phân loại**: Hybrid — SERP API crawl định kỳ (Buy), tự lưu lịch sử vị trí
theo domain và tự tính xu hướng (Build).

**Độ chính xác: ~95%+** — cao nhất trong toàn hệ thống, vì quan sát trực tiếp
từ SERP thật. Chỉ phụ thuộc tần suất crawl. Nhãn `OBSERVED`.

## Nguyên lý

Không crawl riêng cho Rank Tracking. Đọc từ `serp_snapshots` dùng chung, lọc
theo domain quan tâm.

```
serp_snapshots (crawl chung, Top 100)
        │
        │  job compute_rankings
        ▼
rankings (keyword_id, domain, position, url, snapshot_date)
        │
        ├──► vị trí hiện tại
        ├──► thay đổi vị trí (so 2 snapshot)
        └──► biểu đồ xu hướng
```

Hệ quả: theo dõi thêm một domain **không tốn thêm chi phí API** — chỉ là một
bộ lọc khác trên dữ liệu đã có. Đây là lý do N2 (traffic đối thủ) gần như miễn
phí sau khi N1 xong.

## Tính vị trí

`analytics/rank_history.py`, hàm thuần.

```python
def extract_position(snapshot: SerpSnapshot, domain: str) -> int | None:
    """Vị trí tốt nhất (số nhỏ nhất) của domain trong Top 100.
    None nếu không xuất hiện."""
```

Quy tắc:

| Quy tắc | Chi tiết |
|---|---|
| So khớp domain | So theo registrable domain, bỏ `www.`; subdomain tính là cùng domain nếu cấu hình `include_subdomains=true` |
| Nhiều URL cùng domain | Lấy vị trí **tốt nhất**; lưu thêm `all_positions` để phân tích cannibalization |
| Ngoài Top 100 | `None`, **không** gán 101 — 101 là số bịa, sẽ làm hỏng biểu đồ và trung bình |
| Vị trí là vị trí organic | Không tính ads. SERP feature chiếm chỗ thì ghi riêng ở `serp_features` |

## Thay đổi vị trí

```python
def position_change(current: int | None, previous: int | None) -> Change:
    """Dương = cải thiện (vị trí nhỏ hơn)."""
```

| Trường hợp | Kết quả |
|---|---|
| 7 → 5 | `+2`, `improved` |
| 5 → 7 | `-2`, `declined` |
| `None` → 12 | `new` (mới lọt Top 100) |
| 12 → `None` | `lost` (rơi khỏi Top 100) |
| `None` → `None` | `not_ranking` |
| Chỉ có 1 snapshot | `null`, note "Chưa đủ dữ liệu lịch sử" |

Bốn trạng thái cuối là lý do không dùng số 101 thay cho `None`: "rơi khỏi Top
100" và "tụt từ 99 xuống 100" là hai sự kiện khác nhau về ý nghĩa.

## Tần suất crawl

| Tier | Tần suất | Ghi chú |
|---|---|---|
| `priority` | Hàng ngày | Từ khóa đang theo dõi chủ động (~100–300) |
| `standard` | Hàng tuần | Bộ nghiên cứu (~1.000–3.000) |

Độ chính xác ~95%+ chỉ đúng với tần suất phù hợp: dữ liệu crawl tuần trước
không phản ánh vị trí hôm nay. UI luôn hiện `data_fetched_at`.

## Endpoint

```
GET /api/v1/keywords/{id}/history?domain=vaschools.edu.vn&period=90d
GET /api/v1/domains/{domain}/rankings?tier=priority
```

```json
{
  "data": {
    "keyword": "trường quốc tế tphcm",
    "domain": "vaschools.edu.vn",
    "current": { "value": 7, "provenance": "OBSERVED",
                 "url": "https://vaschools.edu.vn/...",
                 "observed_at": "2026-09-28T02:00:00Z" },
    "change_7d":  { "value": 2,  "status": "improved", "provenance": "OBSERVED" },
    "change_30d": { "value": -1, "status": "declined", "provenance": "OBSERVED" },
    "history": [
      { "date": "2026-09-01", "position": 9 },
      { "date": "2026-09-15", "position": null },
      { "date": "2026-09-28", "position": 7 }
    ],
    "competitors_same_keyword": [
      { "domain": "competitor-a.edu.vn", "position": 3 }
    ]
  }
}
```

`position: null` giữ nguyên trong mảng history — biểu đồ phải vẽ **khoảng
trống**, không nối liền hai điểm qua khoảng không xếp hạng.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Biểu đồ đường | Trục Y **đảo ngược** (vị trí 1 ở trên cùng) — đây là quy ước SEO, làm ngược sẽ gây hiểu nhầm |
| Khoảng không xếp hạng | Vẽ đứt đoạn, không nội suy |
| So sánh đối thủ | Nhiều đường trên cùng biểu đồ, chọn domain hiển thị |
| Bảng tổng hợp | Từ khóa · vị trí · thay đổi 7d/30d · URL đang xếp hạng |
| Chỉ báo thay đổi | Mũi tên + màu (xanh lên / đỏ xuống), kèm số |
| Lọc | Chỉ hiện từ khóa tăng / giảm / mới / mất hạng |
| Tần suất | Hiển thị rõ "cập nhật hàng ngày" hay "hàng tuần" theo tier |

## Edge case

| Tình huống | Xử lý |
|---|---|
| Job crawl lỗi một ngày | Không có điểm dữ liệu ngày đó; biểu đồ vẽ đứt, không nội suy |
| Domain đổi URL xếp hạng | Vẫn tính cùng domain; ghi `url` để phát hiện thay đổi |
| Nhiều URL VAS cùng xếp hạng một từ khóa | Lấy vị trí tốt nhất, cảnh báo khả năng cannibalization |
| SERP feature đẩy organic xuống | Vị trí organic giữ nguyên cách tính; ghi riêng feature hiện diện |
| Đổi location/device | Là chuỗi dữ liệu **khác**, không trộn chung biểu đồ |

## Nghiệm thu

- [ ] Vị trí khớp với kiểm tra thủ công trên Google (mẫu 20 từ khóa)
- [ ] Ngoài Top 100 trả `null`, không phải 101
- [ ] Biểu đồ trục Y đảo ngược, vẽ đứt ở khoảng không xếp hạng
- [ ] Phân biệt đúng 5 trạng thái: improved/declined/new/lost/not_ranking
- [ ] Không crawl riêng — dùng chung `serp_snapshots`
