# Lộ trình MVP 7 tuần

## Vì sao nén được từ ~19 tuần xuống 7

Timeline chi tiết trong tài liệu gốc (N1: 8 tuần, N2: 4 tuần, N3: 6 tuần,
N4: 6 tuần) là ước lượng **nếu mỗi module triển khai độc lập**. Nén xuống 7
tuần dựa trên 3 điều kiện, và **chỉ đúng nếu cả 3 được giữ**:

1. **Hạ tầng SERP dùng chung.** Một lần crawl Top 100 SERP phục vụ đồng thời
   Keyword Overview, SERP Simulation, Results/Competition, Rank Tracking,
   Traffic ước tính đối thủ và SERP Features Ideas. Đây là khoản nén lớn nhất
   (~6 tuần).
2. **Thu hẹp phạm vi.** 5–10 domain đối thủ, ngành giáo dục, 1.000–5.000 từ
   khóa/tháng — không phải index hàng triệu từ khóa.
3. **Bỏ AI Search và (có điều kiện) KD% khỏi MVP.**

Nếu mất bất kỳ điều kiện nào, timeline giãn ra. Đây là ước lượng cho **1–2 dev
full-time**, chưa tính thời gian chuyên gia SEO duyệt nội dung (chạy song song).

---

## Bản đồ tuần

| Tuần | Trọng tâm | Module |
|---|---|---|
| 1 | Nền tảng + thu thập dữ liệu | Hạ tầng, N1 |
| 2 | Crawl SERP quy mô + Volume/CPC | N1 |
| 3 | Đối thủ + Organic Research | N1, N2 |
| 4 | Site Audit crawler | N3 |
| 5 | Site Audit hoàn thiện + Rank Tracking | N3, N1 |
| 6 | On-page Checker — 6 nhóm ý tưởng | N4 |
| 7 | Strategy Ideas + duyệt + nghiệm thu | N4, toàn bộ |

---

## Chi tiết từng tuần

### Tuần 1 — Nền tảng + thu thập

| Hạng mục | Đầu ra |
|---|---|
| Khởi tạo repo Python + React, Docker Compose, PostgreSQL, Redis | `docker compose up` chạy được |
| Schema DB v1 (keywords, serp_snapshots, rankings, domains) | Migration chạy sạch |
| Lớp adapter SERP provider (interface + 1 implementation) | Test với fixture, chưa đốt quota thật |
| Đăng ký & cấu hình SERP API + Google Ads API | Gọi thử thành công, đo chi phí/request thật |
| Crawl Google Suggest mở rộng bộ seed keyword ngành giáo dục | ≥ 2.000 từ khóa ứng viên |

**Khó khăn**: chọn bộ seed đủ đại diện để không bỏ sót phân khúc tìm kiếm chính.
Giảm thiểu: lấy seed từ 3 nguồn — GSC query hiện có của VAS, menu/danh mục
website đối thủ, và danh sách thủ công từ Marketing.

**Rủi ro tuần 1**: tài khoản Google Ads chưa active → Volume/CPC không chính
xác. Phát hiện ngay tuần 1, không để đến tuần 3.

### Tuần 2 — Crawl SERP quy mô + Volume/CPC

| Hạng mục | Đầu ra |
|---|---|
| Hàng đợi batch 100 từ khóa/request, retry, rate limit | Xử lý 2.000 từ khóa không thủ công |
| Crawl Top 100 SERP, lưu snapshot có version | Bảng `serp_snapshots` có dữ liệu thật |
| Lấy Search Volume + CPC + Competitive Density | Gắn vào bảng `keywords` |
| Intent Classification (I/N/C/T) bằng LLM | ≥ 90% từ khóa có nhãn intent |
| API đọc: Keyword Overview (tối đa 100 từ khóa/lần) | Endpoint trả JSON đúng contract |

**Khó khăn**: thiết kế queue chịu được giới hạn 100 từ khóa/request và lỗi tạm
thời của provider. Xem [pipeline-and-jobs.md](../01-architecture/pipeline-and-jobs.md).

### Tuần 3 — Đối thủ + Organic Research

| Hạng mục | Đầu ra |
|---|---|
| Bảng CTR chuẩn theo vị trí | [ctr-model.md](../03-data/ctr-model.md) có số cụ thể |
| Tính Organic Keywords + Organic Traffic cho vaschools.edu.vn | Dashboard hiển thị được |
| Traffic Value = Volume × CTR(vị trí) × CPC | Có nhãn `ƯỚC TÍNH` |
| Đối chiếu GA4 thật → hiệu chỉnh bảng CTR | Báo cáo sai lệch trước/sau hiệu chỉnh |
| Phát hiện đối thủ tự động (competitor overlap) + lọc domain nhiễu | Danh sách đối thủ, có bước duyệt thủ công |
| Traffic ước tính cho 5–10 đối thủ, % branded/non-branded | Bảng Compare Domains v1 |
| Tích hợp Backlink provider (N2) | Backlink + Authority Score vào Compare Domains |

**Khó khăn**: cần đủ dữ liệu GA4 lịch sử (tối thiểu vài tháng) để hiệu chỉnh có
ý nghĩa thống kê. Nếu không đủ, dùng bảng CTR ngành công bố và ghi rõ là
**chưa hiệu chỉnh**.

### Tuần 4 — Site Audit crawler

| Hạng mục | Đầu ra |
|---|---|
| Chọn nền crawl + schema phân loại lỗi | Danh mục ≥ 35 loại lỗi, có mức nghiêm trọng |
| Module crawl + phát hiện lỗi cơ bản | Quét hết vaschools.edu.vn |
| Headless browser cho trang render bằng JS | Trang JS không bị báo lỗi giả |
| Tích hợp PageSpeed Insights API | Core Web Vitals theo URL |

**Khó khăn**: định nghĩa đủ danh mục lỗi để không thiếu sót nhiều so với ~40
loại của SEMrush. Xem [error-catalog.md](../02-modules/n3-site-audit/error-catalog.md).

### Tuần 5 — Site Audit hoàn thiện + Rank Tracking

| Hạng mục | Đầu ra |
|---|---|
| Nội dung giải thích lỗi + hướng dẫn khắc phục | Đủ cho mọi loại lỗi đã định nghĩa |
| Rule-based check AI Search readiness | llms.txt, structured data, chunking |
| Giao diện Site Audit (danh sách URL lỗi, mức độ, hướng dẫn) | Người không rành kỹ thuật đọc hiểu |
| Rank Tracking theo thời gian (biểu đồ xu hướng) | Lịch sử vị trí theo domain |
| Đối chiếu chéo SEMrush trên mẫu từ khóa | Báo cáo sai lệch Volume/KD |

**Khó khăn**: nội dung giải thích lỗi cần chuyên gia SEO xác nhận độ chính xác
kỹ thuật trước khi đưa vào sản phẩm. Đặt lịch duyệt từ tuần 4.

### Tuần 6 — On-page Checker, 6 nhóm ý tưởng

| Hạng mục | Đầu ra |
|---|---|
| Chuẩn hóa payload từ 4 module nền về 1 schema nhất quán | 1 payload/URL |
| Prompt template 6 nhóm (Technical, UX, Semantic, Content, SERP Features, Backlink) | Có version, có test case |
| Sinh gợi ý, đối chiếu Top 10 SERP đã crawl | Gợi ý có dẫn chứng đối thủ cụ thể |
| Ưu tiên hóa theo mức tác động | Danh sách trang ưu tiên |

**Khó khăn**: mỗi module nền có schema khác nhau; và phải chọn lọc dữ liệu SERP
liên quan nhất, tránh nhồi quá nhiều gây nhiễu prompt.

### Tuần 7 — Strategy Ideas + duyệt + nghiệm thu

| Hạng mục | Đầu ra |
|---|---|
| Prompt tổng hợp nhóm Chiến lược | Tham chiếu kết quả cả 6 nhóm |
| Cơ chế duyệt của con người cho cả 7 nhóm | Trạng thái `chờ duyệt / đã duyệt / từ chối` |
| Giao diện On-page Checker hoàn chỉnh | 7 nhóm theo từng trang |
| Chạy Validation Gates | [validation-gates.md](../06-delivery/validation-gates.md) |
| Test với Marketing/chuyên gia SEO, thu thập đánh giá | Biên bản nghiệm thu |

**Khó khăn**: chất lượng gợi ý chiến lược khó kiểm chứng bằng dữ liệu cụ thể —
rủi ro cao nhất trong 7 nhóm. Không tự động hóa hoàn toàn.

---

## Mốc nghiệm thu

| Cuối tuần | Chứng minh được điều gì |
|---|---|
| 2 | Tra 100 từ khóa/lần, có volume/CPC/intent/SERP thật |
| 3 | So sánh VAS với 5–10 đối thủ trên 1 bảng; Traffic Value có nhãn nguồn |
| 5 | Quét toàn site, ra danh sách URL lỗi kèm hướng dẫn sửa; theo dõi thứ hạng theo thời gian |
| 7 | 7 nhóm gợi ý on-page theo từng trang, đã qua chuyên gia duyệt |

## Nếu chậm tiến độ — thứ tự cắt giảm

Cắt theo thứ tự này, không cắt tùy tiện:

1. KD% (đã là optional)
2. AI Search readiness trong N3 (giữ phần rule-based tối thiểu)
3. Keyword Strategy Builder (Pillar/Cluster) → đẩy sang sau MVP
4. Nhóm Strategy Ideas trong N4 (giữ 6 nhóm còn lại)
5. % branded/non-branded trong N2

**Không cắt**: nhãn nguồn dữ liệu, cơ chế duyệt của con người, lớp adapter
provider. Ba thứ này rẻ khi làm ngay, rất đắt khi thêm vào sau.
