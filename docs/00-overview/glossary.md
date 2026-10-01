# Thuật ngữ

Dùng thống nhất trong code, UI và tài liệu. Cột "Dùng trong code" là tên định
danh chuẩn — không đặt tên khác.

## Chỉ số SEO

| Thuật ngữ | Tiếng Việt (UI) | Dùng trong code | Nghĩa |
|---|---|---|---|
| Search Volume | Lượng tìm kiếm | `search_volume` | Số lượt tìm trung bình/tháng |
| Keyword Difficulty | Độ khó từ khóa | `keyword_difficulty` | Mức khó lên top, 0–100. Optional MVP |
| CPC | Giá thầu mỗi click | `cpc` | Chi phí trung bình mỗi click quảng cáo |
| Competitive Density | Mật độ cạnh tranh | `competitive_density` | Mức cạnh tranh quảng cáo, 0–1 |
| Results / Competition | Số kết quả | `results_count` | Tổng kết quả Google trả về |
| SERP | Trang kết quả tìm kiếm | `serp` | — |
| SERP Feature | Thành phần đặc biệt SERP | `serp_feature` | Featured snippet, People Also Ask, Local Pack… |
| CTR | Tỷ lệ nhấp | `ctr` | Tỷ lệ click theo vị trí |
| Organic Traffic | Lưu lượng tự nhiên | `organic_traffic` | Ước tính lượt truy cập từ tìm kiếm không trả phí |
| Traffic Value | Giá trị lưu lượng | `traffic_value` | Volume × CTR(vị trí) × CPC |
| Authority Score | Điểm uy tín | `authority_score` | Chỉ số tổng hợp độ mạnh domain |
| Backlink | Liên kết trỏ về | `backlink` | — |
| Branded / Non-branded | Có / không thương hiệu | `is_branded` | Từ khóa có chứa tên thương hiệu hay không |

## Intent

| Mã | Tiếng Anh | Tiếng Việt (UI) | Dùng trong code |
|---|---|---|---|
| I | Informational | Thông tin | `informational` |
| N | Navigational | Điều hướng | `navigational` |
| C | Commercial | Thương mại | `commercial` |
| T | Transactional | Giao dịch | `transactional` |

Chi tiết quy tắc gán nhãn: [intent-taxonomy.md](../03-data/intent-taxonomy.md).

## Match Type

| Loại | Tiếng Việt (UI) | Dùng trong code | Nghĩa |
|---|---|---|---|
| Broad | Rộng | `broad` | Chứa mọi từ trong seed, thứ tự bất kỳ |
| Phrase | Cụm | `phrase` | Chứa nguyên cụm seed liền mạch |
| Exact | Chính xác | `exact` | Trùng khớp seed |
| Related | Liên quan | `related` | Cùng chủ đề, không nhất thiết chứa seed |

## Site Audit

| Thuật ngữ | Tiếng Việt (UI) | Dùng trong code | Nghĩa |
|---|---|---|---|
| Error | Lỗi | `error` | Nghiêm trọng, ảnh hưởng trực tiếp SEO |
| Warning | Cảnh báo | `warning` | Nên sửa, tác động trung bình |
| Notice | Lưu ý | `notice` | Thông tin, tác động thấp |
| Site Health | Sức khỏe website | `site_health` | Điểm tổng hợp 0–100 |
| Core Web Vitals | Chỉ số web cốt lõi | `core_web_vitals` | LCP, INP, CLS |
| Crawlability | Khả năng thu thập | `crawlability` | Bot có truy cập được không |
| Indexability | Khả năng lập chỉ mục | `indexability` | Google có index được không |

## Nội bộ dự án

| Thuật ngữ | Nghĩa |
|---|---|
| **Build** | Không gọi API ngoài, logic hoàn toàn nội bộ |
| **Buy** | Lấy từ nhà cung cấp, hiển thị gần nguyên bản |
| **Hybrid** | Mua dữ liệu thô làm nền, tự build lớp xử lý phía trên |
| **Nhãn nguồn** (provenance) | THẬT vs ƯỚC TÍNH — bắt buộc trên mọi số liệu |
| **Pillar Page** | Trang trụ cột bao quát một chủ đề lớn |
| **Cluster Content** | Các bài vệ tinh xoay quanh Pillar Page |
| **Content Gap** | Nội dung đối thủ có mà VAS chưa có |
| **Competitor Overlap** | Domain xuất hiện cùng VAS trên nhiều SERP |
| **Validation Gate** | Cổng kiểm định đối chiếu chéo trước khi chấp nhận module |
