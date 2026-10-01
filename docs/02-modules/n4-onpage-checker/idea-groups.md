# 7 nhóm ý tưởng

Mỗi nhóm có: nguồn dữ liệu, cách sinh (rule-based hay LLM), và định dạng output.

Định dạng chung của một ý tưởng:

```json
{
  "id": 1042,
  "group": "technical",
  "url": "https://vaschools.edu.vn/hoc-phi",
  "title": "Thêm thẻ meta description",
  "description": "Trang này chưa có meta description...",
  "action": "Viết meta description 120–155 ký tự chứa từ khóa 'học phí trường quốc tế'.",
  "impact": "medium",
  "effort": "low",
  "estimated_traffic_gain": { "value": 120, "provenance": "ESTIMATED" },
  "evidence": [
    { "source": "site_audit", "check_id": "missing_meta_description" }
  ],
  "generated_by": "rule",
  "review_status": "pending_review"
}
```

Trường `evidence` bắt buộc — mỗi gợi ý phải dẫn được về dữ liệu nguồn.
`generated_by` là `"rule"` hoặc `"llm"`, hiển thị khác nhau trên UI.

---

## 1. Technical SEO Ideas — Build

**Nguồn**: Site Audit (N3). **Không gọi LLM, không cần API mới.**

Chuyển findings của Site Audit thành ngôn ngữ gợi ý hành động. Khác biệt với
báo cáo lỗi thuần túy:

| Site Audit nói | Technical Idea nói |
|---|---|
| "Lỗi: thiếu meta description" | "Thêm meta description cho trang Học phí, nên chứa từ khóa 'học phí trường quốc tế' (2.400 lượt tìm/tháng)" |

Ánh xạ: mỗi `check_id` → một template gợi ý, điền dữ liệu từ finding + từ khóa
mục tiêu của trang.

Đây là nhóm **sẵn sàng sớm nhất** (chỉ cần N3) và **đáng tin nhất** (rule-based,
không hallucination). Nên là nhóm đầu tiên ra mắt.

---

## 2. User Experience (UX) Ideas — Hybrid

**Nguồn**: PageSpeed Insights (N3) + GA4.

| Tín hiệu | Nguồn | Gợi ý sinh ra |
|---|---|---|
| LCP kém | PSI | Tối ưu ảnh hero, giảm render-blocking |
| CLS kém | PSI | Đặt kích thước cố định cho ảnh/ads |
| Bounce rate cao | GA4 | Nội dung không khớp intent tìm kiếm |
| Thời gian trên trang thấp | GA4 | Nội dung mỏng hoặc khó đọc |
| Tỷ lệ thoát mobile > desktop | GA4 | Vấn đề trải nghiệm mobile |

Phần rule-based sinh gợi ý từ ngưỡng; LLM diễn giải kết hợp nhiều tín hiệu.

**Cần GA4** — nếu không có quyền truy cập, nhóm này chỉ chạy được phần PSI.
Ghi rõ trên UI thay vì ẩn nhóm.

---

## 3. Semantic Ideas — Hybrid

**Nguồn**: Keyword Magic Tool (N1).

Dùng từ khóa đã mở rộng và topic cluster để gợi ý mở rộng ngữ nghĩa:

```
Với URL và từ khóa mục tiêu của nó:
  1. Lấy topic cluster chứa từ khóa đó
  2. Lấy từ khóa cùng cluster mà trang CHƯA đề cập
     (so khớp với nội dung đã crawl)
  3. Lấy câu hỏi từ People Also Ask của SERP
  4. LLM diễn giải thành gợi ý: nên bổ sung chủ đề gì, đặt ở mục nào
```

Điểm module cao (4,75) vì dữ liệu nền tốt và logic rõ ràng. Không cần LLM cho
bước tìm từ khóa thiếu — chỉ cần cho bước diễn đạt.

---

## 4. Content Ideas — Hybrid

**Nguồn**: Keyword Research (N1) + Competitor Content Gap (N2) + LLM.

Nhóm tổng hợp cross-module:

```
payload = {
  từ khóa mục tiêu + volume + intent,        ← N1
  nội dung hiện tại của trang,                ← N3 crawl
  nội dung Top 10 đối thủ (heading + tóm tắt),← N2 content gap
  khoảng trống nội dung đã phát hiện,         ← N2
  vị trí hiện tại của VAS                     ← N1
}
```

LLM sinh: chủ đề cần bổ sung, phần cần mở rộng, cấu trúc nên có (FAQ, bảng
giá, so sánh).

**Rủi ro hallucination cao** — LLM có thể gợi ý nội dung sai sự thật về VAS
(ví dụ đề nghị nêu chương trình trường không có). Prompt phải nêu rõ: chỉ gợi
ý **loại nội dung**, không bịa **thông tin cụ thể** về trường.

---

## 5. SERP Features Ideas — Hybrid

**Nguồn**: SERP crawl (N1).

```
Với mỗi từ khóa mục tiêu:
  1. Đọc SERP features hiện diện trên SERP đó
  2. Xác định ai đang chiếm feature đó
  3. Nếu đối thủ chiếm mà VAS không → cơ hội
  4. Sinh gợi ý theo loại feature
```

| Feature | Gợi ý tương ứng |
|---|---|
| Featured Snippet | Thêm đoạn trả lời trực tiếp 40–60 từ ngay dưới heading |
| People Also Ask | Thêm mục FAQ với schema `FAQPage` |
| Image Pack | Tối ưu ảnh, thêm alt mô tả |
| Local Pack | Hoàn thiện Google Business Profile, schema `LocalBusiness` |
| Video | Cân nhắc nội dung video |
| Sitelinks | Cải thiện cấu trúc internal link |

Phần lớn là rule-based (ánh xạ feature → gợi ý), LLM chỉ cá nhân hóa theo nội
dung trang.

Kế thừa giới hạn: SERP features chỉ thấy được ở thời điểm crawl, và có thể
thay đổi theo người dùng/vị trí.

---

## 6. Backlink Ideas — Hybrid

**Nguồn**: Backlink Analytics (N2, Buy). Dữ liệu nền mua sẵn, gợi ý hành động
tự xây bằng LLM.

```
1. Lấy backlink gap: referring domain đối thủ có mà VAS không có
2. Lọc domain khả thi (loại spam, domain đã chết)
3. Nhóm theo loại: báo giáo dục, diễn đàn phụ huynh, đối tác, thư mục
4. LLM sinh gợi ý tiếp cận cho từng nhóm
```

Đầu ra hữu ích nhất là **danh sách cụ thể** domain nên tiếp cận, kèm lý do
(đối thủ nào đang có link từ đó, ở trang nào).

Phát triển được với `fake.py` khi chưa có hợp đồng backlink.

---

## 7. Strategy Ideas — Hybrid, rủi ro cao nhất

**Nguồn**: tổng hợp cả 6 nhóm trên bằng LLM.

> **Nhóm rủi ro cao nhất trong toàn dự án.** Chất lượng phụ thuộc hoàn toàn
> vào prompt và khả năng tổng hợp của model. Chất lượng gợi ý chiến lược khó
> kiểm chứng bằng dữ liệu cụ thể.
>
> **BẮT BUỘC chuyên gia SEO/Marketing duyệt trước khi áp dụng. Không tự động
> hóa hoàn toàn.**

Prompt tổng hợp nhận: kết quả 6 nhóm + bối cảnh domain (vị trí trung bình,
traffic ước tính, so sánh đối thủ) và sinh:

| Trường | Nội dung |
|---|---|
| `priority_focus` | 2–3 hướng nên tập trung trong quý |
| `quick_wins` | Việc tác động cao, công sức thấp |
| `long_term` | Đầu tư dài hạn |
| `resource_note` | Ước lượng nguồn lực cần |

Ràng buộc prompt bắt buộc:

- Chỉ tổng hợp từ 6 nhóm đã có, **không đưa ý tưởng mới ngoài dữ liệu**.
- Mỗi khuyến nghị phải dẫn được về ít nhất một ý tưởng cụ thể ở 6 nhóm.
- Không đưa ra con số dự báo traffic/doanh thu.

UI hiển thị nhóm này với cảnh báo mạnh nhất, và **mặc định thu gọn** cho đến
khi được duyệt.

---

## Bảng tổng hợp

| Nhóm | Cần module | Rule/LLM | Sẵn sàng sớm | Rủi ro |
|---|---|---|---|---|
| Technical | N3 | Rule | Tuần 5 | Thấp |
| UX | N3 + GA4 | Rule + LLM | Tuần 6 | Thấp |
| Semantic | N1 | Rule + LLM | Tuần 6 | Thấp |
| SERP Features | N1 | Rule + LLM | Tuần 6 | Trung bình |
| Content | N1 + N2 | LLM | Tuần 6 | Cao |
| Backlink | N2 | LLM | Tuần 6 | Trung bình |
| **Strategy** | **cả 6** | **LLM** | **Tuần 7** | **Cao nhất** |
