# Nhãn nguồn dữ liệu (Provenance)

> **Đây là quy tắc quan trọng nhất của dự án.** Rủi ro lớn nhất không phải là
> số liệu sai — mà là số liệu **ước tính bị đọc nhầm thành số liệu thật** khi
> trình bày với MarHub / Ban lãnh đạo.

## Bốn nhãn

| Nhãn | Nghĩa | Nguồn | Hiển thị UI |
|---|---|---|---|
| `MEASURED` | Đo trực tiếp từ hệ thống của VAS | GA4, GSC | **Thật** (xanh lá) |
| `OBSERVED` | Quan sát trực tiếp từ SERP thật | SERP API | **Quan sát** (xanh dương) |
| `VENDOR` | Nhà cung cấp trả về, ta không tính lại | Keyword Planner, Backlink DB, PSI | **Nhà cung cấp** (xám) |
| `ESTIMATED` | Tự tính bằng mô hình nội bộ | ctr_model, traffic_estimator | **Ước tính** (vàng, có tooltip) |

Thứ tự tin cậy: `MEASURED` > `OBSERVED` > `VENDOR` > `ESTIMATED`.

## Quy tắc lan truyền

**Một số liệu dẫn xuất mang nhãn thấp nhất trong các đầu vào của nó.**

```
Traffic Value = Volume(VENDOR) × CTR(ESTIMATED) × CPC(VENDOR)
             → ESTIMATED
```

```
Vị trí xếp hạng = đọc thẳng từ serp_snapshots
             → OBSERVED
```

```
Organic Traffic = Volume(VENDOR) × CTR(ESTIMATED)
             → ESTIMATED
```

Cài đặt trong `core/provenance.py`: hàm `combine(*sources)` trả về nhãn thấp
nhất. Mọi hàm trong `analytics/` phải trả về giá trị đã bọc nhãn, không trả
về số trần.

## Bảng tra theo chỉ số

| Chỉ số | Nhãn | Ghi chú |
|---|---|---|
| Vị trí SERP hiện tại | `OBSERVED` | Chỉ phụ thuộc tần suất crawl |
| Thay đổi vị trí theo thời gian | `OBSERVED` | So sánh 2 snapshot thật |
| Results / Competition | `OBSERVED` | Đếm từ response |
| SERP Features hiện diện | `OBSERVED` | — |
| Search Volume | `VENDOR` | 70–85% chính xác |
| CPC, Competitive Density | `VENDOR` | Cần tài khoản Ads active |
| Keyword Difficulty | `VENDOR` | Nếu không mua → hiển thị "không có", **không tự tính** |
| Core Web Vitals | `VENDOR` | PSI API, gần như 100% |
| Backlinks, Authority Score | `VENDOR` | Backlink DB |
| Organic Traffic (VAS) | `ESTIMATED` | **Không thay thế GA4** |
| Organic Traffic (đối thủ) | `ESTIMATED` | 70–85% |
| Traffic Value | `ESTIMATED` | — |
| Traffic Cost | `ESTIMATED` | — |
| % branded / non-branded | `ESTIMATED` | — |
| Danh sách đối thủ tự động | `ESTIMATED` | Cần duyệt thủ công |
| Intent (I/N/C/T) | `ESTIMATED` | LLM gán nhãn |
| Topic cluster | `ESTIMATED` | Thuật toán nội bộ |
| Lỗi Site Audit | `OBSERVED` | Quan sát trực tiếp từ trang đã crawl |
| Site Health score | `ESTIMATED` | Điểm tổng hợp theo công thức nội bộ |
| Traffic từ GA4 | `MEASURED` | Nguồn báo cáo chính thức |
| 7 nhóm ý tưởng on-page | `ESTIMATED` + `pending_review` | LLM sinh, phải duyệt |

## Thực thi ở tầng dữ liệu, không ở tầng UI

Sai:

```python
# UI quyết định nhãn — sẽ bị quên khi thêm màn hình mới
return {"traffic": 1234}
```

Đúng:

```python
# Nhãn đi cùng giá trị suốt vòng đời
return Metric(value=1234, provenance=Provenance.ESTIMATED,
              formula="volume * ctr(position)")
```

API response luôn có dạng:

```json
{
  "organic_traffic": {
    "value": 1234,
    "provenance": "ESTIMATED",
    "note": "Ước tính từ Volume × CTR theo vị trí. Không thay thế GA4."
  }
}
```

Frontend có component `<ProvenanceBadge>` bắt buộc dùng ở mọi chỗ hiển thị số
liệu. Không có ngoại lệ. Nếu một màn hình hiển thị số mà không có badge, đó là
bug chặn merge.

## Quy tắc xuất báo cáo

Mọi file export (CSV, PDF, bảng gửi MarHub) phải có:

1. Một cột/chú thích nhãn nguồn cho mỗi chỉ số.
2. Chân trang ghi nguyên văn:

   > Số liệu gắn nhãn **Ước tính** được tính bằng mô hình nội bộ (độ chính xác
   > 70–85%), dùng để so sánh tương đối. Không dùng cho quyết định tài chính.
   > Nguồn traffic chính thức là GA4/GSC.

## Kiểm thử

Test bắt buộc trong `tests/unit/test_provenance.py`:

- `combine()` luôn trả nhãn thấp nhất.
- Mọi hàm public trong `analytics/` trả về đối tượng có `provenance`.
- Không endpoint nào trả về số trần cho các trường trong bảng tra ở trên.

Test cuối cùng nên viết dạng quét schema response, để màn hình mới thêm vào
cũng tự động bị bắt.
