# % Lưu lượng thương hiệu / không thương hiệu

Tách traffic ước tính thành branded và non-branded.

**Phân loại**: Hybrid — suy ra từ Traffic ước tính, tự gắn nhãn branded theo
từ khóa.

## Vì sao chỉ số này quan trọng

Traffic branded phản ánh **độ nhận diện thương hiệu sẵn có**, non-branded phản
ánh **hiệu quả SEO thực sự**. Một trường có 80% traffic branded đang sống nhờ
danh tiếng, không nhờ SEO — và ngược lại.

Khi so sánh với đối thủ, tỷ lệ non-branded là thước đo công bằng hơn tổng
traffic.

## Thuật toán gắn nhãn

`analytics/branded.py`, hàm thuần.

```python
def is_branded(keyword: str, brand_terms: list[str]) -> bool:
    """True nếu từ khóa chứa bất kỳ biến thể tên thương hiệu nào."""
```

Mỗi domain có một bộ `brand_terms` cấu hình được:

```python
BRAND_TERMS = {
    "vaschools.edu.vn": [
        "vas", "vaschools", "va schools",
        "việt úc", "viet uc", "vietnam australia",
        "trường việt úc", "truong viet uc",
    ],
    "competitor-a.edu.vn": [ "..." ],
}
```

Quy tắc so khớp:

| Quy tắc | Lý do |
|---|---|
| So khớp **không dấu, lowercase** cho brand term | Người dùng gõ "viet uc" lẫn "việt úc" |
| So khớp theo **ranh giới từ** | Tránh "vas" khớp nhầm trong "vasco", "đầu tư vas…" |
| Bao gồm cả tên viết tắt và tên đầy đủ | — |
| Bao gồm biến thể sai chính tả phổ biến | Thu thập dần từ dữ liệu thật |

Điểm dễ sai nhất là viết tắt ngắn như "vas" — bắt buộc dùng ranh giới từ, và
nên kiểm tra thủ công danh sách từ khóa được gắn branded ở lần chạy đầu.

## Công thức

```
branded_traffic     = Σ traffic(kw) với is_branded(kw) == True
non_branded_traffic = Σ traffic(kw) với is_branded(kw) == False

branded_pct = branded_traffic / (branded + non_branded)
```

Nhãn `ESTIMATED` — kế thừa từ traffic ước tính.

## Giới hạn

| Giới hạn | Ghi chú |
|---|---|
| Phụ thuộc chất lượng `brand_terms` | Thiếu một biến thể → phân loại sai. Cần rà soát thủ công |
| Đối thủ có tên trùng từ thông dụng | Ví dụ tên trường chứa "quốc tế" — dễ gắn nhầm. Cần quy tắc riêng |
| Từ khóa branded có thể không nằm trong bộ nền | Người dùng tìm thẳng tên trường thường không có trong seed → branded bị ước tính thiếu |
| Kế thừa mọi sai số của traffic ước tính | — |

Giới hạn thứ ba đáng lưu ý: nên **chủ động nạp** các từ khóa branded (tên
trường + biến thể) vào bộ nền, nếu không tỷ lệ branded sẽ bị đánh giá thấp có
hệ thống.

## Endpoint

```
GET /api/v1/competitors/{domain}/traffic  → gồm khối branded
```

```json
{
  "branded_split": {
    "branded":     { "value": 4200,  "pct": 18.8, "provenance": "ESTIMATED" },
    "non_branded": { "value": 18200, "pct": 81.2, "provenance": "ESTIMATED" },
    "brand_terms_used": ["vas", "vaschools", "việt úc"],
    "note": "Phân loại theo danh sách từ khóa thương hiệu cấu hình sẵn."
  }
}
```

Trả `brand_terms_used` để người dùng kiểm chứng và phát hiện thiếu sót.

## Giao diện

- Biểu đồ tròn hoặc thanh xếp chồng, 2 phần.
- So sánh tỷ lệ branded giữa các domain — đây mới là phần có giá trị.
- Link "Xem từ khóa nào được tính là thương hiệu" → bảng lọc, cho phép sửa
  `brand_terms`.
- Badge `ƯỚC TÍNH` trên mọi số.

## Nghiệm thu

- [ ] "vas" không khớp nhầm trong từ không liên quan (test có case này)
- [ ] So khớp được cả có dấu và không dấu
- [ ] Sửa `brand_terms` được từ UI, tính lại ngay
- [ ] Hiển thị danh sách từ khóa được gắn branded để kiểm chứng
- [ ] Ghi rõ giới hạn "branded có thể bị ước tính thiếu do bộ nền"
