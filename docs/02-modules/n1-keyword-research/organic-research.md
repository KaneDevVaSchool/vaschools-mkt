# Organic Research

Organic Keywords, Organic Traffic và Traffic Value cho vaschools.edu.vn.

**Phân loại**: Hybrid — lọc & tính toán trên SERP data đã crawl, không gọi
thêm API mới. Traffic Value kết hợp CPC (Buy) + Organic Traffic (tự tính).

> ## Cảnh báo bắt buộc
>
> **Organic Research tự build KHÔNG thay thế GA4/GSC.** Đây là số liệu
> `ESTIMATED`. Chỉ dùng cho **Traffic Value** và **so sánh công bằng với ước
> tính đối thủ** (vì đối thủ cũng được tính bằng cùng một mô hình). Không dùng
> làm nguồn báo cáo traffic chính thức.
>
> Rủi ro thực tế lớn nhất của module này là ai đó đọc nhầm số ước tính thành
> số thật. Mọi màn hình phải hiện nhãn và cảnh báo.

## Công thức

```
Organic Traffic (mỗi từ khóa)
    = Search Volume × CTR(vị trí)

Traffic Value (mỗi từ khóa)
    = Organic Traffic × CPC

Tổng theo domain
    = Σ trên mọi từ khóa domain đang xếp hạng trong Top 100
```

Nhãn lan truyền: `VENDOR × ESTIMATED = ESTIMATED`. Xem
[data-provenance.md](../../01-architecture/data-provenance.md).

Bảng CTR: [ctr-model.md](../../03-data/ctr-model.md).

## Luồng xử lý

```
serp_snapshots (đã crawl cho N1)
      │  lọc theo domain = vaschools.edu.vn
      ▼
rankings (từ khóa nào, vị trí bao nhiêu, URL nào)
      │  join keyword_metrics (volume, CPC)
      ▼
   × CTR(vị trí)          ← ctr_model, đã hiệu chỉnh bằng GA4
      ▼
traffic_estimates (per keyword)
      │  gộp
      ├──► Organic Keywords  (đếm)
      ├──► Organic Traffic   (tổng)
      ├──► Traffic Value     (tổng × CPC)
      └──► Top Pages         (gộp theo URL)
```

Không có bước nào gọi API mới. Toàn bộ chạy trên dữ liệu đã có — đây là lý do
Organic Research rẻ và nhanh hơn nhiều so với Keyword Research.

## Giới hạn quan trọng: độ phủ bộ từ khóa nền

**Chỉ thấy được những từ khóa có trong bộ nền đã crawl.** Nếu VAS xếp hạng cho
một từ khóa không nằm trong bộ nền, nó không xuất hiện ở đây.

Hệ quả: Organic Traffic ước tính có xu hướng **thấp hơn** thực tế, và độ lệch
phụ thuộc độ phủ bộ nền.

Giảm thiểu:

| Cách | Chi tiết |
|---|---|
| Nạp từ khóa từ GSC | GSC cho biết VAS đang xếp hạng từ khóa nào — nạp vào bộ nền. Cách hiệu quả nhất |
| Mở rộng seed liên tục | Job `expand_seed_keywords` chạy hàng tháng |
| Hiển thị độ phủ | UI hiện "Bộ nền: N từ khóa. Ước tính chỉ tính trên bộ này" |

Nếu có GSC, nên nạp toàn bộ query của VAS vào bộ nền ngay tuần 3 — nó vừa tăng
độ phủ vừa cho phép đối chiếu.

## Đối chiếu GA4 + hiệu chỉnh CTR — Build thuần

**Phân loại Build** — không mua gì thêm, dùng dữ liệu nội bộ VAS.

```
B1. Lấy GA4: organic sessions theo landing page, theo tháng
B2. Lấy ước tính của ta: traffic_estimates gộp theo URL, cùng kỳ
B3. So sánh từng URL: tỷ lệ estimate/actual
B4. Hồi quy bảng CTR để giảm sai lệch tổng thể
B5. Lưu đường cong CTR mới có version (ctr_curves), ghi ngày hiệu chỉnh
```

Bảng CTR sau hiệu chỉnh dùng chung **toàn hệ thống** — cả ước tính traffic đối
thủ ở N2. Đây là lý do đối chiếu GA4 có giá trị vượt ra ngoài module này: hiệu
chỉnh một lần, mọi ước tính đều tốt lên.

**Điều kiện**: cần tối thiểu vài tháng dữ liệu GA4 lịch sử để có ý nghĩa thống
kê. Nếu không đủ, dùng bảng CTR ngành công bố và đánh dấu rõ
`calibrated: false`.

## Endpoint

```
GET /api/v1/domains/{domain}/organic-keywords?page=1&per_page=50
GET /api/v1/domains/{domain}/organic-summary
GET /api/v1/domains/{domain}/top-pages
```

```json
{
  "data": {
    "organic_keywords": { "value": 342, "provenance": "ESTIMATED",
      "note": "Chỉ tính trên bộ từ khóa nền (2.150 từ khóa)" },
    "organic_traffic":  { "value": 12400, "unit": "lượt/tháng",
      "provenance": "ESTIMATED",
      "note": "Ước tính = Volume × CTR. Không thay thế GA4." },
    "traffic_value":    { "value": 185000000, "unit": "VND/tháng",
      "provenance": "ESTIMATED" },
    "ga4_comparison": {
      "ga4_organic_sessions": { "value": 15800, "provenance": "MEASURED" },
      "coverage_ratio": 0.78,
      "note": "Ước tính đạt 78% so với GA4 thật. Chênh lệch chủ yếu do độ phủ bộ từ khóa nền."
    },
    "ctr_model": { "version": "v3", "calibrated": true,
                   "calibrated_at": "2026-09-15" }
  }
}
```

Khối `ga4_comparison` xuất hiện **mọi nơi có thể** — đặt số ước tính cạnh số
thật là cách tốt nhất để không ai đọc nhầm.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Thẻ tổng quan | Organic Keywords / Traffic / Traffic Value, **mỗi thẻ có badge ƯỚC TÍNH** |
| Banner đầu trang | "Số liệu ước tính, không thay thế GA4/GSC" — không ẩn được |
| So sánh GA4 | Hiển thị cạnh nhau: ước tính vs GA4 thật, kèm tỷ lệ |
| Bảng từ khóa | Từ khóa · vị trí · volume · traffic ước tính · traffic value · URL |
| Top Pages | Gộp theo URL, sắp theo traffic ước tính |
| Độ phủ bộ nền | "Bộ nền: N từ khóa" + link giải thích giới hạn |
| Phiên bản CTR | Hiện version + đã hiệu chỉnh hay chưa |

## Edge case

| Tình huống | Xử lý |
|---|---|
| Chưa có GA4 | Bỏ khối so sánh, banner cảnh báo mạnh hơn, `calibrated: false` |
| GA4 ít hơn ước tính | Vẫn hiển thị; thường do bộ nền có từ khóa VAS không thực sự nhận traffic |
| Từ khóa có volume `null` | Bỏ khỏi tổng, đếm riêng "N từ khóa không có dữ liệu volume" |
| CPC `null` | Traffic Value bỏ qua từ khóa đó, ghi chú |
| VAS xếp hạng > 20 | CTR rất thấp; vẫn tính nhưng đóng góp gần 0 |
| Nhiều URL cùng từ khóa | Tính theo vị trí tốt nhất, không cộng dồn |

## Nghiệm thu

- [ ] Không gọi API mới — chỉ đọc dữ liệu đã crawl
- [ ] Mọi số có nhãn `ESTIMATED` + banner cảnh báo không ẩn được
- [ ] Có khối so sánh GA4 khi có dữ liệu GA4
- [ ] Hiển thị rõ độ phủ bộ từ khóa nền
- [ ] Bảng CTR sau hiệu chỉnh được N2 dùng lại (cùng một `ctr_model`)
- [ ] Export CSV có chân trang cảnh báo
