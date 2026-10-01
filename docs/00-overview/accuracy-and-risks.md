# Độ chính xác cam kết & Rủi ro

Tài liệu này là **nguồn sự thật khi trình bày với MarHub / Ban lãnh đạo**. Mọi
con số nêu ở đây phải khớp với nhãn hiển thị trong sản phẩm.

---

## 1. Độ chính xác theo từng chỉ số

### N1 — Keyword & Organic

| Chỉ số | Độ chính xác ước tính | Ghi chú |
|---|---|---|
| Rank Tracking (vị trí website cụ thể) | **~95%+** | Quan sát trực tiếp từ SERP thật, chỉ phụ thuộc tần suất crawl |
| Results/Competition, SERP Simulation | **Cao** | Lấy trực tiếp từ response SERP API, không qua mô hình ước tính |
| Search Volume | **70–85%** | SERP API + Keyword Planner/DataForSEO — đủ để ưu tiên hóa từ khóa, không đủ để dự báo traffic tuyệt đối |
| Keyword Difficulty (KD%) | **Không khả thi tự làm chính xác** | Proxy thô chỉ đạt ~30–50% tin cậy. Khuyến nghị Buy, hoặc dùng Results/Competition thay thế trong MVP |

### N2 — Đối thủ

| Phương án đầu tư dữ liệu | Độ chính xác | Ghi chú |
|---|---|---|
| Chỉ Google Trends/Autosuggest (miễn phí) | **40–60%** | Không có Search Volume thật, chỉ so sánh tương đối |
| **SERP API + Keyword Planner/DataForSEO** (khuyến nghị MVP) | **70–85%** | Đủ để so sánh tương đối VAS vs đối thủ đã biết |
| Quy mô đầy đủ như SEMrush (5–20 triệu từ khóa) | **80–90%** | Không cần thiết cho 5–10 đối thủ — chi phí hạ tầng không tương xứng |

### N3 — Site Audit

| Thành phần | Mức hoàn chỉnh | Ghi chú |
|---|---|---|
| Crawl & phát hiện lỗi kỹ thuật cơ bản | **80–90%** | Đạt hầu hết lỗi phổ biến; một số lỗi hiếm của SEMrush có thể chưa được định nghĩa ở bản đầu |
| Page Speed / Core Web Vitals | **Gần như 100%** | Dùng trực tiếp Google PSI API — cùng nguồn Google dùng để xếp hạng |
| Giải thích lỗi + hướng dẫn khắc phục | **Cao** | Nội dung tự biên soạn, cần chuyên gia SEO rà soát trước khi phát hành |
| AI Search readiness | **Cơ bản, chưa đầy đủ** | Lĩnh vực mới, chưa có chuẩn ngành thống nhất — SEMrush cũng dùng thuật toán độc quyền |

### N4 — On-page Checker

Không có con số độ chính xác định lượng: đây là **gợi ý**, không phải phép đo.
Chất lượng phụ thuộc chất lượng 4 module nền và khả năng tổng hợp của LLM.
Bắt buộc có chuyên gia duyệt.

---

## 2. Rủi ro & Giới hạn

### Rủi ro cấp dự án

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Chi phí API liên tục** — Hybrid không phải build 1 lần dùng mãi; ngừng trả phí = tính năng phụ thuộc SERP ngừng cập nhật | Cao | Nêu rõ trong đề xuất ngân sách; đặt trần quota; xem [cost-model.md](cost-model.md) |
| **Phụ thuộc nhà cung cấp SERP API bên thứ ba** — giá & điều khoản có thể thay đổi | Cao | Lớp adapter bắt buộc, tài liệu hóa để dễ chuyển nhà cung cấp — [provider-abstraction.md](../04-integrations/provider-abstraction.md) |
| **Dễ nhầm GA4 (thật) với Organic Research tự build (ước tính)** | Cao | LUÔN gắn nhãn nguồn cho mỗi số liệu — [data-provenance.md](../01-architecture/data-provenance.md) |
| **Google Keyword Planner cần tài khoản Ads đang chạy** — nếu không, Volume/CPC chỉ là khoảng ước lượng thô | Trung bình | Kiểm tra ngay tuần 1, không để đến tuần 3 |
| Timeline 7 tuần phụ thuộc 3 điều kiện nén | Trung bình | Thứ tự cắt giảm đã định sẵn — [roadmap-7-weeks.md](roadmap-7-weeks.md) |

### Rủi ro theo module

| Rủi ro | Module | Giảm thiểu |
|---|---|---|
| **KD% không tái tạo chính xác** — không có dữ liệu backlink top 10 | N1 | Hiển thị rõ "không có" hoặc dùng Results/Competition thay thế |
| **Giới hạn 100 từ khóa/request** | N1 | Thiết kế hàng đợi ngay từ đầu |
| **Organic Research tự build không thay thế GA4/GSC** | N1 | Chỉ dùng cho Traffic Value và so sánh đối thủ, không dùng làm nguồn báo cáo traffic chính thức |
| **Phát hiện đối thủ tự động có thể lẫn domain không liên quan** (báo, MXH, Wikipedia) | N1, N2 | Danh sách loại trừ + bước duyệt thủ công trước khi vào báo cáo |
| **Số liệu đối thủ là ƯỚC TÍNH** | N2 | Chỉ dùng so sánh xu hướng tương đối; **không dùng cho quyết định tài chính/ngân sách lớn** |
| **Backlink đối thủ KHÔNG giải quyết được bằng Hybrid** | N2 | Giữ nguyên Buy bắt buộc |
| **Bảng CTR chưa tính riêng SERP feature** (featured snippet, ads) | N2, N1 | Ghi rõ giới hạn; hiệu chỉnh dần bằng GA4 |
| **Danh mục lỗi tự định nghĩa có thể thiếu sót** so với ~40 loại SEMrush | N3 | Đối chiếu chéo và bổ sung dần sau ra mắt (Validation Gate) |
| **Trang render bằng JavaScript** cần headless browser | N2, N3 | Playwright/Puppeteer; chấp nhận crawl chậm hơn |
| **Giới hạn tần suất crawl, tôn trọng robots.txt đối thủ** | N2 | Rate limit + tuân thủ robots.txt bắt buộc |
| **AI Search readiness chưa có chuẩn thống nhất** | N3 | Chỉ cam kết mức "kiểm tra cơ bản", không quảng bá tương đương SEMrush |
| **LLM hallucination — gợi ý sai kỹ thuật SEO** | N4 (mọi nhóm) | Cơ chế duyệt của con người cho cả 7 nhóm — [human-review-workflow.md](../05-llm/human-review-workflow.md) |
| **Nhóm Strategy Ideas rủi ro cao nhất** | N4 | BẮT BUỘC chuyên gia SEO/Marketing duyệt, không tự động hóa hoàn toàn |
| **N4 kế thừa giới hạn của 4 module nền** | N4 | Index nhỏ hơn SEMrush/Ahrefs → có thể bỏ sót cơ hội SEMrush phát hiện được |

---

## 3. Những gì KHÔNG cam kết

Nói rõ để tránh kỳ vọng sai:

- Không cam kết Search Volume/KD trùng khớp SEMrush. Nguồn dữ liệu khác nhau
  thì số khác nhau — luôn chú thích rõ khi so sánh.
- Không cam kết phát hiện đủ 100% loại lỗi SEMrush phát hiện được.
- Không cam kết Organic Traffic ước tính khớp GA4. Nếu cần số traffic thật,
  dùng GA4/GSC.
- Không cam kết gợi ý AI đúng 100% — vì vậy mới có bước duyệt của con người.
