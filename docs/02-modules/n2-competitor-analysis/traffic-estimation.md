# Ước tính traffic đối thủ

**Phân loại**: Hybrid — SERP API + Keyword Planner (Buy), mô hình CTR theo vị
trí và tổng hợp theo domain tự Build.

**Độ chính xác: 70–85%** với phương án MVP. Nhãn `ESTIMATED`.

## Dùng chung mô hình với N1

Đây không phải mô hình riêng cho đối thủ. Là **đúng hàm** dùng cho VAS ở
[organic-research.md](../n1-keyword-research/organic-research.md), chỉ khác
tham số domain:

```python
# analytics/traffic_estimator.py
def estimate_domain_traffic(rankings, metrics, ctr_curve) -> Metric:
    """Dùng cho MỌI domain — VAS và đối thủ như nhau."""
```

Điều này quan trọng hơn vẻ ngoài của nó: vì cả hai bên đo bằng cùng một thước,
**sai số có xu hướng triệt tiêu khi so sánh tương đối**. "Đối thủ A lớn gấp
1.8 lần VAS" đáng tin hơn nhiều so với con số tuyệt đối "A có 22.000
lượt/tháng".

Test bắt buộc: gọi hàm với domain VAS và domain đối thủ, xác nhận cùng code
path, cùng `ctr_curve.version`.

## Công thức

```
traffic(domain) = Σ  volume(kw) × ctr(position(domain, kw))
                 kw ∈ từ khóa domain xếp hạng Top 100 trong bộ nền
```

Xem [ctr-model.md](../../03-data/ctr-model.md) cho bảng CTR.

## Ba nguồn sai số đã biết

Nêu rõ để không ai kỳ vọng sai:

| Nguồn sai số | Ảnh hưởng | Xử lý |
|---|---|---|
| **Độ phủ bộ từ khóa nền** | Ước tính **thấp hơn** thực tế — chỉ thấy từ khóa có trong bộ nền | Hiện số lượng bộ nền trên UI; mở rộng seed định kỳ |
| **Bảng CTR chưa tính riêng SERP feature** | Featured snippet / ads / local pack thay đổi CTR thật; có thể sai lệch đáng kể ở một số truy vấn | Ghi rõ giới hạn; Phase 2 hiệu chỉnh theo feature |
| **Volume là trung bình tháng** | Ngành giáo dục có mùa vụ mạnh (mùa tuyển sinh) | Hiển thị trend; cân nhắc hệ số mùa vụ ở Phase 2 |

Ba nguồn này đều nêu trong tài liệu gốc. Nguồn thứ hai là điểm yếu đã biết của
bảng CTR chuẩn — đừng cố che.

## Endpoint

```
GET /api/v1/competitors/{domain}/traffic?period=2026-09
```

```json
{
  "data": {
    "domain": "competitor-a.edu.vn",
    "organic_traffic": { "value": 22400, "unit": "lượt/tháng",
      "provenance": "ESTIMATED",
      "note": "Ước tính từ Volume × CTR trên 2.150 từ khóa nền. Sai số 70–85%." },
    "organic_keywords": { "value": 587, "provenance": "ESTIMATED" },
    "traffic_value": { "value": 340000000, "unit": "VND/tháng",
                       "provenance": "ESTIMATED" },
    "vs_our_domain": {
      "traffic_ratio": 1.81,
      "note": "Đối thủ ước tính lớn gấp 1,81 lần VAS. Cùng mô hình CTR nên tỷ lệ đáng tin hơn số tuyệt đối."
    },
    "top_keywords": [ { "keyword": "…", "position": 2, "est_traffic": 1840 } ],
    "model": { "ctr_version": "v3", "calibrated": true,
               "keyword_base_size": 2150 }
  }
}
```

Trường `vs_our_domain.traffic_ratio` nên là con số được nhấn mạnh trong UI,
không phải giá trị tuyệt đối.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Số nổi bật | **Tỷ lệ so với VAS**, không phải số tuyệt đối |
| Số tuyệt đối | Hiện nhỏ hơn, kèm badge `ƯỚC TÍNH` |
| Xu hướng theo tháng | Biểu đồ đường, nhiều domain |
| Top keywords đóng góp traffic | Bảng, cho biết đối thủ mạnh ở đâu |
| Khối giới hạn mô hình | Liệt kê 3 nguồn sai số, luôn hiển thị (có thể thu gọn, không ẩn hẳn) |
| Kích thước bộ nền | "Tính trên N từ khóa" |

## Edge case

| Tình huống | Xử lý |
|---|---|
| Đối thủ xếp hạng chủ yếu ở từ khóa ngoài bộ nền | Ước tính thấp bất thường — cảnh báo khi số từ khóa chung quá ít |
| Đối thủ có subdomain riêng cho blog | Gộp hay tách theo cấu hình `include_subdomains` |
| Volume `null` cho nhiều từ khóa | Bỏ khỏi tổng, hiện "N từ khóa thiếu volume" |
| Đối thủ mới thêm | Cần ít nhất 1 chu kỳ crawl mới có số |

## Nghiệm thu

- [ ] Dùng **cùng hàm và cùng ctr_version** với N1 (test kiểm chứng)
- [ ] UI nhấn mạnh tỷ lệ so sánh, không phải số tuyệt đối
- [ ] Khối giới hạn mô hình luôn hiển thị
- [ ] Hiện rõ kích thước bộ từ khóa nền
- [ ] Không gọi API mới ngoài dữ liệu đã crawl cho N1
