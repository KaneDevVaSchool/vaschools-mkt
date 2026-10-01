# N3 — Site Audit (Technical SEO)

Kiểm tra sức khỏe kỹ thuật website: Crawling, Indexing, hiệu suất, trải nghiệm
người dùng.

## Yêu cầu gốc từ MarHub

Quét toàn bộ website: Site Health, Errors/Warnings/Notices, Core Web Vitals,
Crawlability/Indexability, Internal Linking. Có cấu hình General, Crawler,
Allow/disallow rules, URL parameter rules, Restrictions bypass.

## Đặc tả chi tiết

| File | Nội dung |
|---|---|
| [crawler-spec.md](crawler-spec.md) | Engine crawl, cấu hình, xử lý JS |
| [error-catalog.md](error-catalog.md) | Danh mục lỗi đầy đủ + mức nghiêm trọng |
| [core-web-vitals.md](core-web-vitals.md) | Tích hợp PageSpeed Insights |
| [site-health-score.md](site-health-score.md) | Công thức điểm tổng hợp |
| [ai-search-readiness.md](ai-search-readiness.md) | Kiểm tra cơ bản, phạm vi hạn chế |

## Module Build nhiều nhất

Đây là module **ít phụ thuộc bên ngoài nhất** trong toàn dự án:

| Thành phần | Loại |
|---|---|
| Crawl phát hiện lỗi toàn site | **Build** |
| Phân loại Errors/Warnings/Notices | **Build** |
| Danh sách URL kèm lỗi | **Build** |
| Giải thích lỗi + hướng dẫn khắc phục | **Build** |
| Core Web Vitals | Buy (PSI API — miễn phí) |
| AI Search readiness | Hybrid (rule-based Build + LLM một phần) |

Hệ quả: **N3 không bị chặn bởi hợp đồng SERP API hay Backlink**. Có thể làm
song song với N1/N2 nếu có người. Đây cũng là module cho ra kết quả hữu ích
sớm nhất mà không tốn chi phí định kỳ.

## Tái sử dụng `vaschools-crawl`

Repo `../vaschools-crawl` đã có pipeline crawl hoàn chỉnh: frontier, HTTP
client, parser, robots/sitemap discovery, classifier hai pha, reporting model.
**Đánh giá tái sử dụng ở tuần 4, trước khi viết dòng crawler nào.** Xem
[repo-structure.md](../../01-architecture/repo-structure.md) mục "Tái sử dụng
vaschools-crawl".

## Độ chính xác cam kết

| Thành phần | Mức hoàn chỉnh |
|---|---|
| Crawl & phát hiện lỗi kỹ thuật cơ bản | **80–90%** |
| Page Speed / Core Web Vitals | **Gần như 100%** (dùng thẳng PSI) |
| Giải thích lỗi + hướng dẫn | **Cao** (cần chuyên gia rà soát) |
| AI Search readiness | **Cơ bản, chưa đầy đủ** |

## Rủi ro chính

| Rủi ro | Giảm thiểu |
|---|---|
| Danh mục lỗi tự định nghĩa thiếu so với ~40 loại SEMrush | Đối chiếu chéo sau ra mắt, bổ sung dần — [validation-gates.md](../../06-delivery/validation-gates.md) |
| Trang render bằng JS cần headless browser, chậm hơn | Playwright, chấp nhận thời gian crawl dài hơn |
| Nội dung giải thích lỗi cần chuyên gia rà soát | Đặt lịch duyệt từ tuần 4, không để dồn |
| AI Search readiness chưa có chuẩn ngành | Chỉ cam kết "kiểm tra cơ bản", không quảng bá tương đương SEMrush |

## Phụ thuộc

| Cần | Chặn gì |
|---|---|
| Quyền crawl vaschools.edu.vn (không bị WAF chặn) | Toàn bộ module |
| PageSpeed Insights API key | Core Web Vitals |
| Playwright cài đặt được trên môi trường chạy | Trang render JS |
| Chuyên gia SEO duyệt nội dung giải thích | Phát hành nội dung hướng dẫn |
