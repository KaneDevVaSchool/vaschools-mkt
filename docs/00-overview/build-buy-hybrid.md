# Phân loại Build / Buy / Hybrid — toàn dự án

## Cách đọc bảng

| Nhãn | Nghĩa |
|---|---|
| **Buy** | Lấy dữ liệu từ nhà cung cấp, hiển thị gần như nguyên bản. Không qua mô hình tự tính. |
| **Build** | Không gọi API bên ngoài. Toàn bộ logic nội bộ. |
| **Hybrid** | Mua dữ liệu thô làm nền, tự build lớp xử lý/tổng hợp/hiển thị phía trên. Cột "Phần tự Build" ghi rõ ta làm gì. |

**Kết luận kiến trúc**: mua **một** nền dữ liệu SERP + Volume làm gốc dùng chung
cho cả 4 nhu cầu; phần lớn giá trị nằm ở lớp Build phía trên. Chỉ backlink là
Buy bắt buộc không thay thế được.

---

## N1 — Nghiên cứu từ khóa & Organic Research

| Tính năng con | Nguồn dữ liệu đầu vào | Loại | Lý do / Phần tự Build |
|---|---|---|---|
| Search Volume | Google Keyword Planner / DataForSEO | Buy | Lấy số liệu trực tiếp, hiển thị gần như nguyên bản |
| Keyword Difficulty (KD%) | Provider API (nếu mua gói phù hợp) | Buy / Optional MVP | Tự tính chỉ đạt ~30–50% tin cậy → không Build. Bỏ khỏi MVP nếu chi phí không hợp lý. Không blocker |
| Results / Competition | SERP API | Buy | Lấy trực tiếp từ response |
| SERP Simulation | SERP API | Buy | Hiển thị lại kết quả thô |
| CPC & Competitive Density | Google Keyword Planner | Buy | Số liệu trả thẳng từ Ads API |
| Rank Tracking theo thời gian | SERP API (crawl định kỳ) | Hybrid | Tự lưu lịch sử vị trí theo domain, tự tính xu hướng/biểu đồ |
| Keyword Magic Tool | Google Suggest + SERP API | Hybrid | Tự xây thuật toán mở rộng ý tưởng, phân nhóm Topic Cluster |
| Phân loại Intent (I/N/C/T) | LLM API | Hybrid | Tự thiết kế prompt, gán nhãn, lưu trữ, kiểm chứng độ chính xác |
| Bộ lọc Match Type | Dữ liệu đã mở rộng ở trên | **Build** | Logic lọc hoàn toàn nội bộ, không gọi thêm API |
| Keyword Strategy Builder | Keyword Magic + crawl đối thủ + LLM | Hybrid | Tự xây clustering theo topic; LLM sinh outline bài SEO |
| Organic Keywords + Organic Traffic (VAS) | SERP data đã crawl | Hybrid | Lọc & tính trên dữ liệu có sẵn, không gọi API mới |
| Traffic Value | CPC (Buy) + Organic Traffic (Hybrid) | Hybrid | Tự tính `Volume × CTR(vị trí) × CPC` |
| Đối chiếu GA4 + hiệu chỉnh CTR | GA4 (nội bộ VAS) | **Build** | Không mua thêm gì; mô hình CTR dùng chung toàn hệ thống |
| Phát hiện đối thủ tự động | SERP data đã có | Hybrid | Tự xây logic lọc domain đối thủ thật, loại domain nhiễu |
| Backlinks / Authority Score (VAS) | Backlink module (mua ở N2) | Buy | Tái sử dụng dữ liệu đã mua, không xử lý thêm |
| AI Search | Nhiều AI model + tự chấm điểm | **Phase 2 — ngoài MVP** | Chưa có đặc tả nguồn dữ liệu/model/scoring |

## N2 — Phân tích đối thủ

| Tính năng con | Nguồn dữ liệu đầu vào | Loại | Lý do / Phần tự Build |
|---|---|---|---|
| Backlink của đối thủ | Backlink Database bên thứ 3 | **Buy bắt buộc** | Không thể tự phát hiện backlink mới ở quy mô toàn cầu — cần bot crawl toàn internet liên tục |
| Traffic ước tính đối thủ (5–10 domain) | SERP API + Keyword Planner | Hybrid | Tự xây mô hình CTR theo vị trí, thu thập SERP định kỳ, tổng hợp theo domain |
| % lưu lượng thương hiệu / không thương hiệu | Traffic ước tính ở trên | Hybrid | Tự gắn nhãn branded/non-branded theo từ khóa |
| Compare Domains (bảng tổng hợp) | Backlink (Buy) + Traffic (Hybrid) | Hybrid | Tự tổng hợp nhiều nguồn vào 1 bảng, tự tính Authority Score / Traffic Cost |
| On-page Competitive Content Signal | Crawl công khai + LLM | Hybrid | Tự crawl 3–5 trang public đối thủ + LLM so sánh, xuất báo cáo content gap |

## N3 — Site Audit

| Tính năng con | Nguồn dữ liệu đầu vào | Loại | Lý do / Phần tự Build |
|---|---|---|---|
| Crawl phát hiện lỗi kỹ thuật toàn site | Crawl chính website VAS | **Build** | Không phụ thuộc API ngoài |
| Phân loại Errors / Warnings / Notices | Rule-based tự định nghĩa | **Build** | Tự định nghĩa danh mục & mức nghiêm trọng |
| Danh sách URL kèm lỗi | Kết quả crawl | **Build** | Xử lý hoàn toàn trên dữ liệu tự crawl |
| Giải thích lỗi + hướng dẫn khắc phục | Nội dung tự biên soạn | **Build** | Cần chuyên gia SEO rà soát trước khi phát hành |
| Page Speed / Core Web Vitals | Google PageSpeed Insights API (miễn phí) | Buy | Cùng nguồn dữ liệu Google dùng để xếp hạng |
| AI Search readiness (llms.txt, structured data, chunking) | Rule-based + LLM một phần | Hybrid | Rule-based tự Build; đánh giá nội dung sâu cần LLM |

## N4 — On-page Checker (7 nhóm ý tưởng)

| Nhóm ý tưởng | Module/nguồn nền | Loại | Lý do / Phần tự Build |
|---|---|---|---|
| Technical SEO Ideas | Site Audit (N3) | **Build** | Chuyển lỗi Site Audit thành ngôn ngữ gợi ý hành động |
| User Experience (UX) Ideas | PageSpeed Insights + GA4 | Hybrid | Kết hợp 2 nguồn có sẵn, tự xây logic sinh gợi ý |
| Semantic Ideas | Keyword Magic Tool (N1) | Hybrid | Dùng từ khóa đã mở rộng, tự sinh gợi ý ngữ nghĩa |
| Content Ideas | Keyword Research + Content Gap + LLM | Hybrid | Tổng hợp cross-module, LLM sinh gợi ý nội dung |
| SERP Features Ideas | SERP crawl (N1) | Hybrid | Phân tích SERP feature đối thủ đang chiếm, tự xây logic so sánh |
| Backlink Ideas | Backlink Analytics (Buy) | Hybrid | Dữ liệu nền mua sẵn, gợi ý hành động tự xây bằng LLM |
| Strategy Ideas | Tổng hợp 6 nhóm trên bằng LLM | Hybrid | **Rủi ro cao nhất** — bắt buộc chuyên gia SEO duyệt trước khi hiển thị |

---

## Tổng kết theo loại

| Loại | Số tính năng con | Ghi chú |
|---|---|---|
| Buy | 7 | Volume, CPC, Results/Competition, SERP Simulation, PSI, Backlink, Authority Score |
| Build | 8 | Match Type filter, hiệu chỉnh CTR, toàn bộ crawl Site Audit, Technical Ideas |
| Hybrid | 18 | Phần lớn giá trị sản phẩm nằm ở đây |
| Phase 2 | 1 | AI Search |

**Hệ quả ngân sách**: chỉ 2 khoản chi định kỳ thực sự — SERP API và Backlink DB.
Xem [cost-model.md](cost-model.md).
