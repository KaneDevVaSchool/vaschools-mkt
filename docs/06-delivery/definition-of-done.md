# Definition of Done

## DoD chung — áp dụng cho mọi tính năng

Không tính là xong nếu thiếu bất kỳ mục nào:

- [ ] Mọi số liệu hiển thị có **nhãn nguồn** (`MEASURED`/`OBSERVED`/`VENDOR`/`ESTIMATED`)
- [ ] Xử lý đủ 4 trạng thái UI: loading, empty, error, stale
- [ ] Endpoint có phân trang (nếu trả danh sách)
- [ ] Không endpoint nào gọi API ngoài trong request người dùng
- [ ] Có unit test cho logic analytics (hàm thuần)
- [ ] Có fixture cho mọi lời gọi provider
- [ ] Message lỗi bằng tiếng Việt, dễ hiểu
- [ ] Responsive ở 3 breakpoint (≤480px, ≤768px, ≥1280px)
- [ ] Export (nếu có) kèm cột nhãn nguồn + chân trang cảnh báo

## DoD theo module

### N1 — Keyword Research

- [ ] Tra 100 từ khóa/lần, vượt giới hạn báo lỗi rõ ràng
- [ ] 4 match type đúng quan hệ bao hàm `exact ⊆ phrase ⊆ broad`
- [ ] Intent đạt ≥ 85% trên bộ vàng 200 từ khóa (≥ 90% cho C và T)
- [ ] KD% vắng mặt không làm hỏng bảng
- [ ] Rank Tracking: ngoài Top 100 trả `null`, biểu đồ trục Y đảo ngược
- [ ] Organic Research có banner "không thay thế GA4" không ẩn được
- [ ] Phát hiện đối thủ: domain báo/MXH/wiki bị lọc
- [ ] Phân biệt từ khóa tiếng Việt có dấu / không dấu

### N2 — Competitor Analysis

- [ ] So sánh tới 10 domain
- [ ] VAS và đối thủ dùng **cùng `ctr_version`** (test kiểm chứng)
- [ ] UI nhấn mạnh tỷ lệ so sánh, không phải số tuyệt đối
- [ ] Banner "không dùng cho quyết định tài chính" không ẩn được
- [ ] Content gap tuân thủ `robots.txt` (có test)
- [ ] Rate limit 1 req/2s/domain (có test)
- [ ] Backlink chạy được với `fake.py` khi chưa có hợp đồng

### N3 — Site Audit

- [ ] Đủ 44 check, mỗi check có test với fixture HTML
- [ ] Mỗi finding chỉ rõ URL và vị trí cụ thể
- [ ] Nội dung giải thích đã qua chuyên gia SEO duyệt
- [ ] Trang render JS không bị báo lỗi giả
- [ ] Core Web Vitals ưu tiên field data, ghi rõ khi rơi về lab
- [ ] Site Health có cảnh báo "không so sánh được với SEMrush"
- [ ] AI Search readiness có disclaimer trong API response

### N4 — On-page Checker

- [ ] 7 nhóm hoạt động (nhóm thiếu dữ liệu nền hiện rõ lý do)
- [ ] Mọi ý tưởng có `evidence` dẫn về dữ liệu nguồn
- [ ] Mọi ý tưởng mặc định `pending_review`
- [ ] Strategy Ideas mặc định thu gọn tới khi duyệt
- [ ] **Không** hiển thị tổng traffic gain cộng dồn
- [ ] Duyệt hàng loạt + phím tắt hoạt động
- [ ] Không có con số nào do LLM sinh ra (rà soát code)

## DoD cấp dự án — trước khi bàn giao

- [ ] Toàn bộ Validation Gates đạt — [validation-gates.md](validation-gates.md)
- [ ] `.env.example` đầy đủ, khớp `config.py`
- [ ] `docker compose up` chạy được từ repo sạch
- [ ] README hướng dẫn chạy local
- [ ] Trần quota cấu hình và hoạt động
- [ ] Chi phí API thực tế đo được, đối chiếu với ước tính
- [ ] Biên bản nghiệm thu với Marketing/chuyên gia SEO
- [ ] Tài liệu chuyển đổi nhà cung cấp SERP API đã viết

## Không tính là xong

Những điều dễ bị coi là "gần xong" nhưng không phải:

| Tình trạng | Vì sao chưa xong |
|---|---|
| "Chạy được nhưng chưa có nhãn nguồn" | Nhãn nguồn là yêu cầu chức năng, không phải trang trí |
| "Có gợi ý LLM nhưng chưa có duyệt" | Quy trình duyệt là một phần của tính năng |
| "Test bằng dữ liệu thật, chưa có fixture" | Test không tái lập được là test không dùng được |
| "Gọi API ngoài trực tiếp trong endpoint" | Vi phạm kiến trúc, sẽ đốt quota khi có người dùng |
| "Hardcode key/số CTR để chạy thử" | — |
