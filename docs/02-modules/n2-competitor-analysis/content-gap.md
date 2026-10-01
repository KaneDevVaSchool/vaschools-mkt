# On-page Competitive Content Signal (Content Gap)

Crawl 3–5 trang public của đối thủ, dùng LLM so sánh với nội dung VAS, xuất
báo cáo khoảng trống nội dung.

**Phân loại**: Hybrid — tự crawl (Build) + LLM so sánh (Buy).

## Trang cần crawl

Với mỗi đối thủ, 3–5 trang có giá trị cạnh tranh cao nhất trong ngành giáo dục:

| Loại trang | Vì sao quan trọng |
|---|---|
| Chương trình học | Nội dung quyết định của phụ huynh |
| Học phí | Từ khóa thương mại volume cao nhất |
| Giới thiệu / Về chúng tôi | Tín hiệu E-E-A-T |
| Tuyển sinh | Intent giao dịch |
| Cơ sở vật chất | Khác biệt cạnh tranh |

Cách tìm URL: ưu tiên URL đối thủ đang xếp hạng cao trong `rankings` (đã biết
từ SERP crawl), sau đó mới tới dò sitemap. Trang đang xếp hạng là trang Google
đã xác nhận có giá trị.

## Quy tắc crawl — bắt buộc tuân thủ

Đây là crawl website của bên thứ ba. Ràng buộc không được vi phạm:

| Quy tắc | Chi tiết |
|---|---|
| **Tôn trọng `robots.txt`** | Đọc và tuân thủ trước mọi request. Không có ngoại lệ |
| **Rate limit** | Tối đa 1 request / 2 giây / domain |
| **User-Agent trung thực** | Khai báo rõ bot, kèm URL liên hệ |
| **Chỉ trang public** | Không đăng nhập, không vượt tường phí, không dò URL ẩn |
| **Tần suất thấp** | Hàng tháng là đủ — nội dung trang giới thiệu đổi rất chậm |
| **Giới hạn số trang** | 3–5 trang/đối thủ, không crawl toàn site |

Vi phạm những điều này vừa là rủi ro pháp lý vừa có thể khiến IP bị chặn.

## Trích xuất

```
fetcher (httpx)
   │ nếu nội dung rỗng / chỉ có <div id="root"></div>
   ▼
Playwright (headless)     ← trang render bằng JavaScript
   │
   ▼
parser (selectolax)
   ├─ title, meta description
   ├─ cấu trúc heading (H1–H3, giữ thứ bậc)
   ├─ nội dung text chính (bỏ nav/footer/sidebar)
   ├─ số từ
   ├─ schema.org structured data
   ├─ ảnh (số lượng, có alt hay không)
   └─ internal/external links
```

Lưu vào `crawl_pages` kèm `fetched_at` và `render_mode` (`html` hoặc `js`).

## Phân tích LLM

Payload gửi LLM (đã chuẩn hóa, không gửi HTML thô):

```json
{
  "our_page":       { "url": "…", "title": "…", "headings": [...],
                      "content_summary": "…", "word_count": 850 },
  "competitor_pages": [ { "domain": "…", "url": "…", "title": "…",
                          "headings": [...], "content_summary": "…",
                          "word_count": 1400 } ],
  "target_keywords": ["học phí trường quốc tế"],
  "serp_context": { "our_position": 7, "their_positions": {"competitor-a": 2} }
}
```

LLM sinh ra:

| Trường | Nội dung |
|---|---|
| `missing_topics` | Chủ đề đối thủ có, VAS không có |
| `thinner_sections` | Phần VAS có nhưng mỏng hơn đáng kể |
| `unique_strengths` | Điểm VAS mạnh hơn (đừng chỉ nói điểm yếu) |
| `structural_gaps` | Khác biệt cấu trúc: bảng giá, FAQ, ảnh, video |
| `recommendations` | Hành động cụ thể, xếp theo mức tác động |

**LLM không sinh số liệu.** Word count, vị trí SERP đều lấy từ dữ liệu crawl
và chèn vào payload.

`content_summary` nên là bản tóm tắt do ta trích (heading + đoạn đầu mỗi
mục), không phải toàn văn — vừa giảm chi phí token vừa giảm nhiễu prompt.

Mọi output ở trạng thái `pending_review`.

## Endpoint

```
POST /api/v1/competitors/content-gap
```

```json
{ "our_url": "https://vaschools.edu.vn/hoc-phi",
  "competitor_urls": ["https://competitor-a.edu.vn/hoc-phi"],
  "target_keywords": ["học phí trường quốc tế"] }
```

Trả `202` + `job_id` (có crawl + LLM).

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| So sánh cạnh nhau | Cấu trúc heading VAS vs đối thủ, highlight phần thiếu |
| Danh sách chủ đề thiếu | Kèm link tới phần tương ứng trên trang đối thủ |
| Chỉ số cơ bản | Word count, số heading, có FAQ/bảng giá/ảnh — dạng bảng, nhãn `OBSERVED` |
| Khuyến nghị | Xếp theo tác động, có nút duyệt/từ chối |
| Banner | "Gợi ý AI — chưa qua chuyên gia duyệt" khi `pending_review` |
| Ngày crawl | Nội dung đối thủ có thể đã đổi |

## Edge case

| Tình huống | Xử lý |
|---|---|
| `robots.txt` cấm crawl trang đó | **Bỏ qua trang đó**, ghi rõ lý do trên UI. Không vòng tránh |
| Trang render JS, Playwright vẫn rỗng | Đánh dấu `failed`, bỏ khỏi so sánh |
| Đối thủ chặn IP | Dừng crawl domain đó, cảnh báo, không retry dồn dập |
| Trang đối thủ dài gấp nhiều lần | Nêu rõ chênh lệch word count; dài hơn không tự động là tốt hơn |
| VAS không có trang tương ứng | Gợi ý "cần tạo mới", đây là phát hiện có giá trị |
| LLM trả JSON sai schema | Retry 1 lần; vẫn sai → hiện phần chỉ số crawl được, bỏ phần gợi ý |

## Nghiệm thu

- [ ] Tuân thủ `robots.txt`, có test chứng minh trang bị cấm thì bỏ qua
- [ ] Rate limit 1 req/2s/domain, có test
- [ ] Xử lý được trang render JS
- [ ] LLM không sinh số liệu
- [ ] Mọi gợi ý ở `pending_review`
- [ ] Nêu cả điểm mạnh của VAS, không chỉ điểm yếu
