# Bộ từ khóa hạt giống

Khó khăn đã nêu ở tuần 1: **"Chọn bộ từ khóa hạt giống đủ đại diện để không
bỏ sót phân khúc tìm kiếm chính."**

Đây là quyết định ảnh hưởng tới **mọi** module: Organic Research chỉ thấy từ
khóa trong bộ nền; traffic ước tính đối thủ cũng vậy; N4 chỉ gợi ý được trên
từ khóa đã biết. Bộ seed kém = toàn hệ thống thiếu sót có hệ thống.

## Ba nguồn seed — dùng cả ba

| Nguồn | Ưu điểm | Cách lấy |
|---|---|---|
| **1. Google Search Console** | Từ khóa VAS **đang thực sự** nhận hiển thị — chính xác nhất | Export toàn bộ query 12 tháng |
| **2. Cấu trúc website đối thủ** | Phủ phân khúc VAS chưa nhắm tới | Crawl menu, breadcrumb, tiêu đề danh mục của 5–10 đối thủ |
| **3. Danh sách thủ công từ Marketing** | Kiến thức ngành, thuật ngữ nội bộ | Workshop với đội Marketing |

Nguồn 1 là quan trọng nhất và hay bị bỏ qua. Nếu chỉ làm được một việc trong
tuần 1, hãy export GSC.

## Khung phân loại — kiểm tra độ phủ

Bộ seed phải phủ đủ các chiều sau. Dùng làm checklist, không phải danh sách
đầy đủ.

### Theo cấp học

```
mầm non · tiểu học · thcs · thpt · lớp 1 … lớp 12
nhà trẻ · mẫu giáo · cấp 1 · cấp 2 · cấp 3
```

### Theo loại hình

```
trường quốc tế · trường song ngữ · trường tư thục · trường dân lập
trường nội trú · trường bán trú · trường chất lượng cao
```

### Theo chương trình

```
chương trình ib · cambridge · a-level · igcse · ap
tú tài quốc tế · chương trình mỹ · chương trình anh · chương trình úc
song ngữ quốc tế
```

### Theo địa điểm

```
tphcm · hồ chí minh · quận 2 · quận 7 · thủ đức · bình thạnh
hà nội · đà nẵng · gần đây · khu vực…
```

### Theo mối quan tâm của phụ huynh

```
học phí · chi phí · bảng học phí · học bổng
tuyển sinh · nộp hồ sơ · điều kiện · thủ tục
cơ sở vật chất · giáo viên · sĩ số · chương trình học
đánh giá · review · có tốt không · so sánh
xe đưa đón · bán trú · bữa ăn · ngoại khóa
```

### Theo thương hiệu

```
tên VAS + biến thể · tên từng đối thủ + biến thể
```

Từ khóa branded **phải** có trong bộ nền — nếu không, tỷ lệ branded traffic
sẽ bị đánh giá thấp có hệ thống. Xem
[branded-traffic.md](../02-modules/n2-competitor-analysis/branded-traffic.md).

## Tổ hợp tự động

Từ các chiều trên, sinh tổ hợp có nghĩa:

```
{loại hình} + {địa điểm}        → "trường quốc tế tphcm"
{loại hình} + {cấp học}         → "trường song ngữ tiểu học"
{mối quan tâm} + {loại hình}    → "học phí trường quốc tế"
{mối quan tâm} + {loại hình} + {địa điểm}
```

Không sinh mọi tổ hợp — phần lớn vô nghĩa. Lọc bằng Google Suggest: tổ hợp
nào Suggest có gợi ý thì giữ, không có thì bỏ.

## Tiếng Việt: có dấu và không dấu

**Giữ cả hai dạng như hai từ khóa riêng.** Chúng có volume và SERP khác nhau
thực tế:

```
"trường quốc tế tphcm"  ≠  "truong quoc te tphcm"
```

Nhiều người gõ không dấu, đặc biệt trên mobile. Bỏ qua dạng không dấu là bỏ
qua một phần lưu lượng thật.

## Tiếng Anh

Phụ huynh ngành trường quốc tế thường tìm bằng tiếng Anh. Đưa vào seed:

```
international school hcmc · bilingual school vietnam
ib school ho chi minh · british school saigon · tuition fee
```

## Quy mô mục tiêu

| Giai đoạn | Số từ khóa | Ghi chú |
|---|---|---|
| Seed thủ công + GSC | 200–400 | Đầu vào tuần 1 |
| Sau mở rộng Suggest | 2.000–3.000 | Cuối tuần 1 |
| Sau lọc rác | 1.500–2.500 | Bộ nền làm việc |
| Tier `priority` | 100–300 | Theo dõi hàng ngày |

Quy mô này khớp với ước tính chi phí $50–200/tháng ở
[cost-model.md](../00-overview/cost-model.md).

## Lọc rác

Xem danh sách chặn ở
[keyword-magic-tool.md](../02-modules/n1-keyword-research/keyword-magic-tool.md).
Chính: tuyển dụng, việc làm, lương giáo viên, tải tài liệu.

Từ khóa tuyển dụng là nguồn nhiễu lớn nhất trong ngành giáo dục — "trường
quốc tế tuyển dụng" có volume cao nhưng không liên quan tuyển sinh.

## Bảo trì

| Việc | Tần suất |
|---|---|
| Nạp query mới từ GSC | Hàng tháng |
| Chạy `expand_seed_keywords` | Hàng tháng |
| Rà soát danh sách chặn | Hàng quý |
| Xem lại độ phủ theo khung phân loại | Hàng quý |
| Kiểm tra từ khóa đối thủ xếp hạng mà ta chưa có | Hàng quý |

Việc cuối là cách phát hiện lỗ hổng bộ nền hiệu quả nhất: nếu đối thủ xếp
hạng nhiều từ khóa không có trong bộ nền, bộ nền đang thiếu.

## Lưu trữ

Bộ seed gốc lưu trong repo để theo vết được:

```
backend/src/vaschools_mkt/data/seed_keywords.yaml
```

Từ khóa mở rộng lưu trong DB với `source` ghi rõ nguồn (`seed`, `suggest`,
`paa`, `gsc`, `serp_title`).

## Nghiệm thu

- [ ] Phủ đủ 6 chiều trong khung phân loại
- [ ] Có cả dạng có dấu và không dấu
- [ ] Có từ khóa tiếng Anh
- [ ] Có từ khóa branded của VAS và từng đối thủ
- [ ] Đã nạp query từ GSC
- [ ] Từ khóa tuyển dụng bị lọc
- [ ] Bộ nền 1.500–2.500 từ khóa sau lọc
