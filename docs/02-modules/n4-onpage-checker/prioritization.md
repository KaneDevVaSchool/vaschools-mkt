# Ưu tiên hóa & ước tính tác động

Yêu cầu gốc: "Tổng quan số lượng ý tưởng SEO on-page, **ước tính traffic tăng
thêm nếu tối ưu**, danh sách trang ưu tiên."

Khó khăn đã nêu: "Tránh hiển thị quá nhiều gợi ý gây rối — cần ưu tiên hóa
theo mức độ tác động."

## Ước tính traffic tăng thêm

**Nhãn `ESTIMATED`.** Đây là ước lượng thô, không phải dự báo.

```
traffic_gain(idea) = volume(kw) × [ctr(vị_trí_mục_tiêu) - ctr(vị_trí_hiện_tại)]
                     × xác_suất_thành_công(loại_ý_tưởng)
```

Vị trí mục tiêu: giả định cải thiện khiêm tốn, không phải "lên top 1":

| Vị trí hiện tại | Vị trí mục tiêu giả định |
|---|---|
| 11–20 | 8 |
| 6–10 | 4 |
| 4–5 | 3 |
| 1–3 | giữ nguyên (gain = 0) |
| Ngoài Top 100 | không ước tính (`null`) |

Xác suất thành công theo loại ý tưởng:

| Loại | Xác suất | Lý do |
|---|---|---|
| Technical (lỗi rõ ràng) | 0,7 | Sửa lỗi có tác động khá chắc chắn |
| UX / Core Web Vitals | 0,5 | Ảnh hưởng gián tiếp |
| Semantic / Content | 0,4 | Phụ thuộc chất lượng thực thi |
| SERP Features | 0,3 | Cạnh tranh, không đảm bảo chiếm được |
| Backlink | 0,2 | Phụ thuộc bên thứ ba |
| Strategy | — | **Không ước tính** — quá tổng hợp để quy ra số |

Các hệ số này là **giả định ban đầu**, cần hiệu chỉnh bằng dữ liệu thực tế sau
vài tháng. Ghi rõ version của bộ hệ số trong response.

## Cảnh báo bắt buộc

> Con số "traffic tăng thêm" là ước lượng thô dựa trên giả định cải thiện vị
> trí. **Không phải cam kết.** Dùng để **xếp thứ tự ưu tiên giữa các việc**,
> không dùng để đặt mục tiêu KPI.

Đây là con số dễ bị lạm dụng nhất trong toàn hệ thống — ai đó sẽ cộng tổng
mọi ý tưởng và coi đó là mục tiêu. UI phải chống lại điều này: **không hiển
thị tổng traffic gain của mọi ý tưởng cộng lại** (các ý tưởng chồng lấn nhau,
cộng dồn là sai về mặt toán học).

## Ma trận Impact / Effort

Mỗi ý tưởng có `impact` và `effort` ∈ {low, medium, high}.

```
              Effort thấp        Effort cao
            ┌─────────────────┬─────────────────┐
Impact cao  │  QUICK WINS     │  DỰ ÁN LỚN      │
            │  làm ngay       │  lên kế hoạch   │
            ├─────────────────┼─────────────────┤
Impact thấp │  LÀM KHI RẢNH   │  BỎ QUA         │
            │                 │                 │
            └─────────────────┴─────────────────┘
```

`effort` xác định bằng rule theo loại ý tưởng (thêm meta description = low;
viết lại nội dung = high), không để LLM tự đánh giá — LLM không biết nguồn
lực của đội.

## Điểm ưu tiên

```
priority_score = normalize(traffic_gain) × 0.5
               + impact_weight           × 0.3
               + (1 - effort_weight)     × 0.2
```

Với `impact_weight`: high=1,0 / medium=0,6 / low=0,3 và tương tự cho effort.

## Danh sách trang ưu tiên

Xếp hạng URL, không chỉ ý tưởng:

```
page_priority = Σ priority_score(ideas của trang)
              × log(1 + organic_traffic_hiện_tại)
```

Nhân với traffic hiện tại vì: sửa một trang đã có traffic mang lại kết quả
nhanh hơn sửa một trang chưa ai vào.

## Endpoint

```
GET /api/v1/onpage/priority-pages
```

```json
{
  "data": [{
    "url": "https://vaschools.edu.vn/hoc-phi",
    "priority_score": 87,
    "idea_count": { "total": 12, "by_group": { "technical": 4, "content": 3 } },
    "quick_wins": 5,
    "estimated_traffic_gain": { "value": 340, "unit": "lượt/tháng",
      "provenance": "ESTIMATED",
      "note": "Ước lượng thô. Không phải cam kết. Dùng để xếp ưu tiên." },
    "current_traffic": { "value": 1200, "provenance": "ESTIMATED" }
  }],
  "meta": { "impact_model_version": "v1", "calibrated": false }
}
```

`calibrated: false` cho tới khi có dữ liệu thực tế hiệu chỉnh hệ số.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Mặc định hiển thị | **Chỉ Quick Wins** — tránh rối mắt |
| Bộ lọc | Theo nhóm, theo impact/effort, theo trạng thái duyệt |
| Ma trận 2×2 | Trực quan hóa impact/effort, click ô để lọc |
| Traffic gain | Badge `ƯỚC TÍNH` + tooltip cảnh báo |
| **Không có tổng cộng dồn** | Không hiện "tổng có thể tăng X lượt" |
| Danh sách trang ưu tiên | Bảng riêng, sắp theo `priority_score` |
| Model version | Hiện version + đã hiệu chỉnh hay chưa |

## Nghiệm thu

- [ ] Không hiển thị tổng traffic gain cộng dồn
- [ ] Cảnh báo "không phải cam kết" luôn hiện cạnh con số
- [ ] Mặc định chỉ hiện Quick Wins
- [ ] `effort` xác định bằng rule, không do LLM
- [ ] Strategy Ideas không có traffic gain
- [ ] Hệ số ghi rõ version và trạng thái hiệu chỉnh
