# Validation Gates

Cổng kiểm định trước khi chấp nhận một module. Mục tiêu: **đo được khoảng
cách với SEMrush và tài liệu hóa nó**, không phải đạt bằng SEMrush.

Tài liệu gốc nêu rõ nhiều chỗ: "cần đối chiếu chéo với SEMrush". Đây là quy
trình thực hiện điều đó.

---

## Gate 1 — Rank Tracking (tuần 5)

**Cam kết: ~95%+**

```
Mẫu: 20 từ khóa ngẫu nhiên từ tier priority
Cách: kiểm tra thủ công trên Google (ẩn danh, đúng location VN)
      trong vòng 2 giờ sau khi crawl
```

| Kết quả | Hành động |
|---|---|
| ≥ 19/20 khớp (±1 vị trí) | Đạt |
| 15–18/20 | Điều tra: location, personalization, thời điểm crawl |
| < 15/20 | **Không đạt** — kiểm tra lại adapter và cách so khớp domain |

Sai lệch thường gặp và không phải lỗi: kết quả cá nhân hóa, SERP thay đổi
giữa lúc crawl và lúc kiểm tra.

---

## Gate 2 — Search Volume (tuần 5)

**Cam kết: 70–85%**

```
Mẫu: 50 từ khóa có volume đa dạng
Đối chiếu: SEMrush (hoặc Ahrefs) cùng thời điểm, cùng location
```

| Chỉ số | Ngưỡng |
|---|---|
| Tương quan Spearman (thứ tự) | **≥ 0,8** |
| Sai lệch trung vị | ≤ 40% |
| Số từ khóa lệch > 3 lần | ≤ 5/50 |

Tương quan thứ tự quan trọng hơn sai lệch tuyệt đối: mục đích chính của
volume là **ưu tiên hóa từ khóa**, không phải dự báo traffic. Nếu thứ tự
đúng, công cụ dùng được dù số khác SEMrush.

Ghi lại mức chênh lệch điển hình để chú thích khi trình bày.

---

## Gate 3 — Intent Classification (tuần 2)

**Cam kết: ≥ 85%**

```
Bộ vàng: 200 từ khóa do chuyên gia SEO gán nhãn thủ công
Lưu tại: tests/fixtures/intent_golden_set.json
```

| Chỉ số | Ngưỡng |
|---|---|
| Độ chính xác tổng thể | ≥ 85% |
| Độ chính xác nhóm C | ≥ 90% |
| Độ chính xác nhóm T | ≥ 90% |

Chạy lại mỗi khi đổi prompt version.

---

## Gate 4 — Organic Traffic vs GA4 (tuần 3)

**Không có ngưỡng đạt/không đạt** — đây là gate **đo lường và tài liệu hóa**.

```
So sánh: Organic Traffic ước tính vs GA4 organic sessions
Kỳ: 3 tháng gần nhất, theo landing page
```

Cần ghi lại:

| Chỉ số | Dùng để |
|---|---|
| Tỷ lệ coverage (ước tính / GA4) | Hiển thị trên UI |
| Tương quan theo URL | Biết ước tính có phản ánh đúng thứ tự trang mạnh/yếu |
| URL lệch nhiều nhất | Tìm nguyên nhân (thường là độ phủ bộ nền) |

Kết quả gate này **hiển thị trực tiếp trên UI** trong khối `ga4_comparison`.
Đây là cách trung thực nhất để trình bày giới hạn của mô hình.

---

## Gate 5 — Site Audit vs SEMrush (tuần 6)

**Cam kết: 80–90% độ phủ loại lỗi phổ biến**

```
Chạy: audit của ta + SEMrush Site Audit trên cùng vaschools.edu.vn,
      cùng ngày
```

| Chỉ số | Ngưỡng |
|---|---|
| Loại lỗi SEMrush phát hiện mà ta cũng phát hiện | ≥ 80% |
| Lỗi ta báo mà SEMrush không báo (false positive?) | Rà soát thủ công từng loại |
| Số URL trùng khớp cho cùng loại lỗi | ≥ 85% |

**Đầu ra bắt buộc**: danh sách loại lỗi SEMrush có mà ta thiếu → đưa vào
backlog bổ sung danh mục. Đây chính là cơ chế "bổ sung dần sau khi ra mắt"
nêu trong rủi ro N3.

Lưu ý: một số lỗi SEMrush dựa trên thuật toán độc quyền (đặc biệt AI Search
readiness) không tái tạo chính xác được — ghi nhận, không coi là thất bại.

---

## Gate 6 — Chất lượng gợi ý LLM (tuần 7)

```
Mẫu: 50 ý tưởng ngẫu nhiên, trải đều 7 nhóm
Người đánh giá: chuyên gia SEO
```

| Chỉ số | Ngưỡng |
|---|---|
| Tỷ lệ duyệt tổng thể | ≥ 60% |
| Tỷ lệ từ chối vì `sai_kỹ_thuật_seo` | ≤ 10% |
| Tỷ lệ từ chối vì `sai_thông_tin_vas` | **≤ 5%** |
| Nhóm Strategy — tỷ lệ duyệt | ≥ 50% |

Chỉ số `sai_thông_tin_vas` nghiêm ngặt nhất: đây là hallucination gây rủi ro
thương hiệu, không chỉ rủi ro SEO.

Tỷ lệ duyệt 60% là ngưỡng hợp lý cho gợi ý AI — không phải mọi gợi ý đều
đúng, và bước duyệt tồn tại chính vì điều đó.

---

## Gate 7 — Chi phí thực tế (cuối tháng 1)

```
So sánh: hóa đơn thực tế vs estimated_cost_usd trong job_runs
```

| Chỉ số | Ngưỡng |
|---|---|
| Sai lệch ước tính chi phí | ≤ 20% |
| Chi phí tháng | Trong ngân sách đã duyệt |

Nếu vượt: điều chỉnh tần suất crawl theo tier, không âm thầm vượt ngân sách.

---

## Bảng tổng hợp

| Gate | Tuần | Ngưỡng chính | Chặn phát hành? |
|---|---|---|---|
| 1. Rank Tracking | 5 | ≥ 19/20 khớp | **Có** |
| 2. Search Volume | 5 | Spearman ≥ 0,8 | **Có** |
| 3. Intent | 2 | ≥ 85% | **Có** |
| 4. Traffic vs GA4 | 3 | Đo và hiển thị | Không |
| 5. Site Audit vs SEMrush | 6 | ≥ 80% độ phủ | **Có** |
| 6. Chất lượng LLM | 7 | Duyệt ≥ 60%, bịa ≤ 5% | **Có** |
| 7. Chi phí | Cuối tháng 1 | Sai lệch ≤ 20% | Không |

## Nguyên tắc

**Gate không đạt không có nghĩa là bỏ tính năng** — có nghĩa là điều chỉnh
cam kết và ghi rõ giới hạn trước khi phát hành. Người dùng chấp nhận được
công cụ 80% nếu biết nó 80%; họ không chấp nhận được công cụ được giới thiệu
là 100% mà thực ra 80%.
