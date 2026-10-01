# Mô hình chi phí

## Chi phí định kỳ (vận hành)

| Hạng mục | Chi phí ước tính | Bắt buộc | Ghi chú |
|---|---|---|---|
| SERP API (DataForSEO/SerpAPI), ~1.000–5.000 từ khóa/tháng | **$50–200/tháng** | Có | Dùng chung cho N1, N2, N4. Khoản chi lớn nhất |
| Backlink Database | **Theo báo giá** | Có (N2) | Buy bắt buộc — không thay thế được bằng Hybrid. Cần chốt nhà cung cấp trước tuần 3 |
| Google Keyword Planner | **Miễn phí** | Có | Cần tài khoản Google Ads **đang chạy** để có số liệu chính xác |
| Google PageSpeed Insights API | **Miễn phí** | Có | Có quota; xem [pagespeed-insights.md](../04-integrations/pagespeed-insights.md) |
| GA4 Data API | **Miễn phí** | Có | Dữ liệu nội bộ VAS |
| LLM API (intent, clustering, 7 nhóm ý tưởng) | **Theo mức dùng** | Có | Chi phí biến thiên theo số URL audit. Cần đặt trần |
| Keyword Difficulty (KD%) | **Tùy gói provider** | Không | Optional MVP — mua nếu chi phí hợp lý |
| Hosting (app + PostgreSQL + Redis) | Hạ tầng nội bộ | Có | Tái dùng hạ tầng hiện có nếu được |

**Tổng ước tính lõi**: ~$50–200/tháng cho SERP API, cộng backlink và LLM theo
mức dùng.

## So sánh

| Phương án | Chi phí | Phạm vi |
|---|---|---|
| SEMrush Guru / Ahrefs Standard | $199–249/tháng | Đầy đủ, đa ngành, index toàn cầu |
| vaschools-mkt (Hybrid) | ~$50–200/tháng + backlink + LLM | 5–10 đối thủ ngành giáo dục, tùy biến theo nhu cầu VAS |

Lợi thế không nằm ở giá tuyệt đối mà ở: dữ liệu tùy biến theo VAS, tích hợp
GA4 nội bộ, và gợi ý on-page tự động theo quy trình riêng.

## Cảnh báo quan trọng

> **Đây là kiến trúc Hybrid, không phải "build một lần dùng mãi miễn phí".**
> Ngừng trả phí SERP API = mọi tính năng phụ thuộc SERP ngừng cập nhật
> (Rank Tracking, Traffic ước tính, Compare Domains, SERP Features Ideas).
> Dữ liệu đã crawl vẫn còn trong DB nhưng sẽ cũ dần.

## Kiểm soát chi phí

| Cơ chế | Chi tiết |
|---|---|
| Trần quota theo tháng | Cấu hình số request tối đa; vượt trần thì dừng job, không tự động tiêu thêm |
| Cache SERP snapshot | Không crawl lại từ khóa đã crawl trong N ngày (mặc định 7 ngày cho keyword thường, 1 ngày cho keyword đang theo dõi) |
| Phân tầng tần suất crawl | Từ khóa ưu tiên: hàng ngày. Từ khóa thường: hàng tuần. Xem [scheduling-and-quota.md](../07-ops/scheduling-and-quota.md) |
| Trần chi phí LLM | Giới hạn số URL audit/ngày; cache kết quả theo hash nội dung trang |
| Theo dõi chi phí thực tế | Log số request + chi phí quy đổi mỗi job; cảnh báo khi đạt 80% trần |

Đo chi phí thật ngay tuần 1 khi gọi API lần đầu — không để đến cuối dự án mới
biết ước lượng sai.
