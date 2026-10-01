# Mô hình CTR

Bảng tỷ lệ nhấp theo vị trí SERP. **Dùng chung toàn hệ thống** — cả ước tính
traffic của VAS (N1) và của đối thủ (N2).

**Phân loại: Build.** Không mua gì; hiệu chỉnh bằng GA4 nội bộ.

## Vì sao dùng chung là quan trọng

Nếu VAS và đối thủ dùng hai mô hình khác nhau, mọi so sánh đều vô nghĩa. Dùng
chung một đường cong khiến sai số có xu hướng triệt tiêu khi so tỷ lệ — "đối
thủ lớn gấp 1,8 lần" đáng tin hơn nhiều so với con số tuyệt đối.

Cưỡng chế bằng test: gọi `estimate_domain_traffic` cho domain VAS và domain
đối thủ, xác nhận cùng `ctr_version`.

## Đường cong khởi điểm (v1, chưa hiệu chỉnh)

Dùng cho tới khi có đủ dữ liệu GA4. Nguồn: các nghiên cứu CTR ngành công bố.

| Vị trí | CTR | Vị trí | CTR |
|---|---|---|---|
| 1 | 0,284 | 11–15 | 0,010 |
| 2 | 0,152 | 16–20 | 0,006 |
| 3 | 0,099 | 21–30 | 0,003 |
| 4 | 0,071 | 31–50 | 0,0015 |
| 5 | 0,054 | 51–100 | 0,0005 |
| 6 | 0,043 | > 100 | 0 |
| 7 | 0,035 | | |
| 8 | 0,029 | | |
| 9 | 0,025 | | |
| 10 | 0,022 | | |

Lưu trong `ctr_curves` với `version='v1'`, `calibrated=false`.

```json
{"1": 0.284, "2": 0.152, "3": 0.099, "...": "..."}
```

Vị trí 11+ dùng giá trị trung bình của khoảng, không nội suy — sai số ở đuôi
không đáng để phức tạp hóa.

## Hiệu chỉnh bằng GA4 — Build

```
B1. Lấy GA4: organic sessions theo landing page, theo tháng (≥ 3 tháng)
B2. Lấy rankings của VAS cùng kỳ, cùng landing page
B3. Ghép: mỗi (URL, tháng) có vị trí trung bình + volume + sessions thật
B4. Với mỗi nhóm vị trí, tính CTR thực nghiệm:
       ctr_thực_tế(vị_trí) = Σ sessions / Σ volume
B5. Làm mượt (tránh nhiễu do mẫu nhỏ):
       ctr_mới = α × ctr_thực_tế + (1-α) × ctr_v1
       với α tăng theo kích thước mẫu ở vị trí đó
B6. Lưu version mới, đặt is_active=true
```

Bước B5 quan trọng: với vị trí chỉ có 2–3 mẫu, CTR thực nghiệm rất nhiễu.
Trộn với đường cong gốc theo kích thước mẫu tránh việc một URL bất thường làm
lệch cả mô hình.

Gợi ý: `α = n / (n + 20)` với `n` là số mẫu ở vị trí đó. Vị trí có 20 mẫu thì
tin nửa dữ liệu thực nghiệm, 100 mẫu thì tin 83%.

## Điều kiện hiệu chỉnh có ý nghĩa

| Điều kiện | Tối thiểu |
|---|---|
| Số tháng dữ liệu GA4 | 3 tháng |
| Số cặp (URL, từ khóa) khớp được | 100 |
| Số vị trí có ≥ 5 mẫu | 10 |

Không đủ → giữ `v1`, đánh dấu `calibrated=false`, hiển thị rõ trên UI. Hiệu
chỉnh trên dữ liệu quá ít còn tệ hơn không hiệu chỉnh.

## Giới hạn đã biết

| Giới hạn | Ảnh hưởng |
|---|---|
| **Chưa tính riêng SERP feature** | Featured snippet, ads, local pack thay đổi CTR đáng kể. Đây là giới hạn đã nêu trong tài liệu gốc |
| Không phân biệt intent | Từ khóa navigational có CTR vị trí 1 cao hơn nhiều |
| Không phân biệt thiết bị | Mobile và desktop khác nhau |
| Không tính branded | Từ khóa thương hiệu có CTR rất cao ở vị trí 1 |
| Hiệu chỉnh từ dữ liệu VAS | Áp cho đối thủ là giả định — nhưng là giả định nhất quán |

Phase 2 có thể tách đường cong theo intent và thiết bị. MVP giữ một đường
cong duy nhất: đơn giản, giải thích được, và đủ cho mục đích so sánh tương đối.

## API

```python
# analytics/ctr_model.py — hàm thuần
def ctr_for_position(position: int | None, curve: CtrCurve) -> float:
    """CTR cho vị trí. position=None → 0.0"""

def load_active_curve(session) -> CtrCurve:
    """Đường cong đang active. Chỉ nơi này biết version nào đang dùng."""
```

Mọi nơi tính traffic phải đi qua hai hàm này. Không hardcode số CTR ở bất kỳ
đâu khác.

## Hiển thị

Mọi màn hình dùng traffic ước tính phải hiện:

```
Mô hình CTR: v3 · Đã hiệu chỉnh bằng GA4 ngày 15/09/2026 · 1.240 mẫu
```

hoặc:

```
Mô hình CTR: v1 · Chưa hiệu chỉnh (dùng số liệu ngành)
```

## Nghiệm thu

- [ ] Một đường cong duy nhất dùng cho cả VAS và đối thủ (test kiểm chứng)
- [ ] Hiệu chỉnh có làm mượt theo kích thước mẫu
- [ ] Không hiệu chỉnh khi dữ liệu dưới ngưỡng
- [ ] Version và trạng thái hiệu chỉnh hiện trên UI
- [ ] Đổi version tính lại được ước tính lịch sử mà không crawl lại
- [ ] Không có số CTR hardcode ngoài `ctr_model.py`
