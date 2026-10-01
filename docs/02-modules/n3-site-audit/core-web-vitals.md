# Core Web Vitals

**Phân loại: Buy** — Google PageSpeed Insights API (miễn phí).

**Độ chính xác: gần như 100%** — dùng trực tiếp kết quả Google trả về, cùng
nguồn dữ liệu Google dùng để xếp hạng. Không tự tính lại. Nhãn `VENDOR`.

## Hai loại dữ liệu PSI trả về

Điểm dễ nhầm nhất khi làm việc với PSI:

| Loại | Nguồn | Ý nghĩa | Dùng để |
|---|---|---|---|
| **Field data** (CrUX) | Người dùng thật, 28 ngày qua | Cái Google thực sự dùng để xếp hạng | Đánh giá chính thức |
| **Lab data** (Lighthouse) | Mô phỏng trong môi trường chuẩn | Chẩn đoán, tái lập được | Tìm nguyên nhân |

**Ưu tiên field data.** Chỉ khi trang không đủ lưu lượng để có CrUX mới rơi về
lab data — và phải ghi rõ trên UI, vì hai con số có thể khác nhau đáng kể.

## Ngưỡng

| Chỉ số | Tốt | Cần cải thiện | Kém |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2,5s | 2,5–4,0s | > 4,0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200–500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0,1 | 0,1–0,25 | > 0,25 |

Ngưỡng theo chuẩn Google. Khớp với check `lcp_poor`, `inp_poor`, `cls_poor`
trong [error-catalog.md](error-catalog.md).

INP đã thay thế FID từ tháng 3/2024 — dùng INP, không dùng FID.

## Chọn URL để đo

PSI có quota và mỗi request mất vài giây. **Không đo mọi trang.**

Thứ tự ưu tiên:

```
1. Trang chủ
2. Trang có organic traffic ước tính cao nhất (từ N1)
3. Trang đang xếp hạng cho từ khóa ưu tiên
4. Mỗi template một đại diện (chương trình, tin tức, liên hệ…)
```

Mặc định 20–50 URL/lần chạy, cấu hình được. Đo cả mobile và desktop — Google
xếp hạng theo mobile-first, nên mobile quan trọng hơn.

## Job

```
fetch_pagespeed  — hàng tuần
```

CWV thay đổi chậm (field data là trung bình 28 ngày). Hàng tuần đủ; hàng ngày
lãng phí quota mà số gần như không đổi.

## Lưu trữ

`psi_raw` giữ nguyên response JSON. Lý do: PSI trả về rất nhiều thông tin
chẩn đoán (opportunities, diagnostics) mà ta có thể dùng sau — đặc biệt cho
N4 UX Ideas — nhưng chưa parse hết ở MVP.

## Endpoint

```
GET /api/v1/audits/{id}/core-web-vitals
```

```json
{
  "data": [{
    "url": "https://vaschools.edu.vn/",
    "device": "mobile",
    "data_source": "field",
    "lcp": { "value": 3.2, "unit": "s", "rating": "needs_improvement",
             "provenance": "VENDOR" },
    "inp": { "value": 180, "unit": "ms", "rating": "good",
             "provenance": "VENDOR" },
    "cls": { "value": 0.08, "rating": "good", "provenance": "VENDOR" },
    "performance_score": { "value": 68, "provenance": "VENDOR" },
    "top_opportunities": [
      { "id": "render_blocking_resources", "savings_ms": 850 }
    ],
    "measured_at": "2026-09-28T04:00:00Z"
  }]
}
```

`data_source` bắt buộc có: `"field"` hay `"lab"` thay đổi cách diễn giải con số.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Ba chỉ số | LCP/INP/CLS, màu theo rating (xanh/vàng/đỏ) |
| Chuyển mobile/desktop | Tab, mặc định **mobile** |
| Nhãn nguồn dữ liệu | "Dữ liệu người dùng thật (28 ngày)" vs "Dữ liệu phòng lab" |
| Bảng theo URL | Sắp theo mức độ tệ |
| Cơ hội cải thiện | Từ `top_opportunities`, dịch sang tiếng Việt |
| Link PSI gốc | Cho người muốn xem chi tiết đầy đủ |

## Edge case

| Tình huống | Xử lý |
|---|---|
| Trang không đủ lưu lượng cho CrUX | Rơi về lab data, ghi rõ `data_source: "lab"` |
| PSI timeout | Retry 2 lần, sau đó đánh dấu `failed`, không chặn audit |
| Hết quota PSI | Dừng job, giữ dữ liệu cũ, cảnh báo |
| Trang trả 4xx | Bỏ qua, đã có check riêng bắt lỗi này |
| Field và lab chênh lệch lớn | Hiện cả hai, ghi chú — thường là dấu hiệu cache/CDN |

## Nghiệm thu

- [ ] Ưu tiên field data, rơi về lab data có ghi rõ
- [ ] Dùng INP, không dùng FID
- [ ] Mặc định hiển thị mobile
- [ ] Không tự tính lại chỉ số — nhãn `VENDOR`
- [ ] Giữ raw response cho dùng sau
- [ ] Hết quota không làm hỏng cả audit
