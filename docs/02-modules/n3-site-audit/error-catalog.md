# Danh mục lỗi

Danh mục lỗi tự định nghĩa, phân 3 mức nghiêm trọng. Mục tiêu: phủ **80–90%**
các loại lỗi phổ biến; SEMrush có ~40 loại, danh mục dưới đây có **44 check**.

## Mức nghiêm trọng

| Mức | Nghĩa | Màu | Tính vào Site Health |
|---|---|---|---|
| `error` | Ảnh hưởng trực tiếp khả năng index/xếp hạng | đỏ | Trọng số cao |
| `warning` | Nên sửa, tác động trung bình | vàng | Trọng số trung bình |
| `notice` | Thông tin, tác động thấp | xám | Trọng số thấp |

## Cấu trúc một check

Mỗi check định nghĩa trong `analytics/audit_rules/`, một file một nhóm:

```python
@dataclass(frozen=True)
class Check:
    id: str                    # "broken_internal_link"
    severity: Severity
    category: Category
    title_vi: str              # "Liên kết nội bộ hỏng"
    description_vi: str        # Lỗi này là gì
    why_it_matters_vi: str     # Vì sao ảnh hưởng SEO
    how_to_fix_vi: str         # Hướng dẫn khắc phục cụ thể
    detect: Callable[[PageRecord, SiteContext], Finding | None]
```

Ba trường nội dung tiếng Việt là phần **cần chuyên gia SEO rà soát** trước khi
phát hành. Tách khỏi code detect để chuyên gia sửa được mà không đụng logic —
cân nhắc lưu ở file YAML riêng.

---

## 1. Crawlability & Indexability (10 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `page_5xx` | error | Lỗi máy chủ 5xx | Status 500–599 |
| `page_4xx` | error | Trang không tồn tại 4xx | Status 400–499 (trừ 401/403 có chủ ý) |
| `broken_internal_link` | error | Liên kết nội bộ hỏng | Link nội bộ trỏ tới URL 4xx/5xx |
| `blocked_by_robots` | error | Bị robots.txt chặn | URL trong sitemap nhưng robots.txt disallow |
| `noindex_page` | error | Trang có thẻ noindex | Meta robots hoặc X-Robots-Tag `noindex` |
| `redirect_chain` | warning | Chuỗi chuyển hướng | ≥ 2 lần redirect liên tiếp |
| `redirect_loop` | error | Vòng lặp chuyển hướng | Redirect quay lại URL đã đi qua |
| `orphan_page` | warning | Trang mồ côi | Có trong sitemap, không có internal link nào trỏ tới |
| `broken_external_link` | warning | Liên kết ngoài hỏng | Link ra ngoài trả 4xx/5xx |
| `deep_page` | notice | Trang quá sâu | Cần > 4 click từ trang chủ |

## 2. Thẻ meta & nội dung head (9 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `missing_title` | error | Thiếu thẻ title | Không có `<title>` hoặc rỗng |
| `duplicate_title` | error | Title trùng lặp | ≥ 2 trang cùng title |
| `title_too_long` | warning | Title quá dài | > 60 ký tự (ước tính cắt trên SERP) |
| `title_too_short` | warning | Title quá ngắn | < 10 ký tự |
| `missing_meta_description` | warning | Thiếu meta description | Không có hoặc rỗng |
| `duplicate_meta_description` | warning | Meta description trùng | ≥ 2 trang cùng nội dung |
| `meta_description_length` | notice | Độ dài meta description | < 70 hoặc > 160 ký tự |
| `missing_canonical` | warning | Thiếu thẻ canonical | Không có `rel=canonical` |
| `canonical_to_non_200` | error | Canonical trỏ tới trang lỗi | Target canonical không trả 200 |

## 3. Cấu trúc nội dung (7 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `missing_h1` | error | Thiếu thẻ H1 | Không có `<h1>` |
| `multiple_h1` | warning | Nhiều H1 | > 1 thẻ `<h1>` |
| `empty_h1` | error | H1 rỗng | `<h1>` không có text |
| `heading_hierarchy_broken` | notice | Thứ bậc heading sai | H3 xuất hiện trước H2 |
| `thin_content` | warning | Nội dung mỏng | < 300 từ (trừ trang danh mục/liên hệ) |
| `duplicate_content` | error | Nội dung trùng lặp | Độ tương đồng ≥ 90% với trang khác |
| `no_internal_links_out` | notice | Không có liên kết đi ra | Trang không link tới trang nội bộ nào |

## 4. Hình ảnh & tài nguyên (5 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `image_missing_alt` | warning | Ảnh thiếu alt | `<img>` không có `alt` (trừ ảnh trang trí có `alt=""`) |
| `image_broken` | error | Ảnh hỏng | `src` trả 4xx/5xx |
| `image_too_large` | warning | Ảnh quá nặng | > 200 KB |
| `image_no_modern_format` | notice | Ảnh chưa dùng định dạng hiện đại | Không phải WebP/AVIF |
| `broken_resource` | error | Tài nguyên hỏng | CSS/JS trả 4xx/5xx |

## 5. Hiệu suất (5 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `slow_page_load` | warning | Trang tải chậm | TTFB > 1,5s khi crawl |
| `lcp_poor` | error | LCP kém | LCP > 4,0s (PSI) |
| `inp_poor` | error | INP kém | INP > 500ms (PSI) |
| `cls_poor` | error | CLS kém | CLS > 0,25 (PSI) |
| `large_page_size` | warning | Trang quá nặng | HTML > 500 KB |

Ngưỡng LCP/INP/CLS theo chuẩn Core Web Vitals của Google. Xem
[core-web-vitals.md](core-web-vitals.md).

## 6. Bảo mật & kỹ thuật (4 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `mixed_content` | error | Nội dung hỗn hợp | Trang HTTPS tải tài nguyên HTTP |
| `no_https` | error | Không dùng HTTPS | URL http:// không redirect sang https |
| `missing_viewport` | error | Thiếu thẻ viewport | Không có meta viewport → không responsive |
| `invalid_hreflang` | warning | Hreflang sai | Mã ngôn ngữ không hợp lệ hoặc không đối ứng |

## 7. Structured data & AI readiness (4 check)

| ID | Mức | Tên | Phát hiện khi |
|---|---|---|---|
| `missing_structured_data` | warning | Thiếu structured data | Không có schema.org JSON-LD |
| `invalid_structured_data` | error | Structured data sai cú pháp | JSON-LD không parse được |
| `missing_llms_txt` | notice | Thiếu llms.txt | Không có `/llms.txt` |
| `poor_content_chunking` | notice | Cấu trúc nội dung khó trích xuất | Thiếu heading phân đoạn, đoạn văn quá dài |

Xem [ai-search-readiness.md](ai-search-readiness.md) — nhóm này chỉ cam kết
mức **kiểm tra cơ bản**.

---

**Tổng: 44 check.** Danh mục mở — thêm check là thêm một entry, không sửa
crawler.

## Nội dung giải thích — quy trình

Mỗi check cần 3 đoạn nội dung tiếng Việt, viết cho **người không rành kỹ
thuật**:

```yaml
# audit_rules/content/broken_internal_link.yaml
title_vi: "Liên kết nội bộ hỏng"
description_vi: >
  Trang này chứa liên kết trỏ tới một địa chỉ không tồn tại trên website.
why_it_matters_vi: >
  Người dùng bấm vào sẽ gặp trang lỗi và có thể rời website. Google cũng
  đánh giá thấp website có nhiều liên kết hỏng.
how_to_fix_vi: >
  Mở trang chứa liên kết, tìm đường dẫn được liệt kê bên dưới, rồi sửa
  thành địa chỉ đúng hoặc xóa liên kết nếu trang đích đã bị gỡ.
```

Quy trình: dev viết bản nháp → **chuyên gia SEO rà soát và duyệt** → phát hành.
Check chưa duyệt vẫn chạy detect nhưng UI hiện nội dung mặc định tối thiểu.

## Cấu trúc Finding

```json
{
  "check_id": "broken_internal_link",
  "severity": "error",
  "category": "crawlability",
  "url": "https://vaschools.edu.vn/chuong-trinh",
  "details": { "broken_url": "https://vaschools.edu.vn/cu",
               "anchor_text": "xem thêm", "status_code": 404 },
  "provenance": "OBSERVED",
  "detected_at": "2026-09-28T03:12:00Z"
}
```

Trường `details` khác nhau theo check — nhưng luôn phải đủ để người sửa **biết
chính xác sửa ở đâu**. Một finding không chỉ ra được vị trí là finding vô dụng.

## Nghiệm thu

- [ ] Đủ 44 check, mỗi check có test với fixture HTML
- [ ] Mỗi finding chỉ rõ URL và vị trí cụ thể trong trang
- [ ] Nội dung giải thích tách khỏi code, sửa được không cần deploy
- [ ] Đối chiếu chéo SEMrush trên cùng website, ghi lại loại lỗi bị bỏ sót
- [ ] Không báo lỗi giả trên trang render JS
