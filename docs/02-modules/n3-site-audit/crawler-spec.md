# Đặc tả Crawler

**Phân loại: Build.** Không phụ thuộc API bên ngoài.

## Pipeline

```
URL gốc (vaschools.edu.vn)
    │
    ├─► robots.txt          đọc rule, lấy sitemap
    ├─► sitemap.xml         đệ quy sitemap index
    │
    ▼
frontier (hàng đợi URL)
    │  dedupe · giới hạn độ sâu · allow/disallow rules
    ▼
fetcher (httpx)  ──► nếu nội dung rỗng/JS ──► Playwright
    │
    ▼
parser (selectolax)
    │  trích DomFacts: title, meta, heading, link, ảnh, schema
    ▼
PageRecord  (fetch + dom + provenance)
    │
    ▼  sau khi crawl xong toàn bộ — cần ngữ cảnh toàn site
audit_rules  ──► Findings   (duplicate, orphan, broken link cần biết cả site)
    │
    ▼
audit_issues + site_health_score
```

Điểm quan trọng: **một số check chỉ chạy được sau khi crawl xong.**
`duplicate_title`, `orphan_page`, `broken_internal_link` đều cần biết toàn bộ
site. Vì vậy phát hiện lỗi là **pha thứ hai**, chạy một lần trên toàn bộ
record — không phải phát hiện dần trong lúc crawl.

Mô hình hai pha này giống `vaschools-crawl` (xem ARCHITECTURE.md của repo đó):
pha 1 rẻ để quyết định chính sách crawl, pha 2 là hàm thuần trên toàn bộ dữ
liệu. Đáng tái sử dụng.

## Cấu hình

Theo yêu cầu gốc (General, Crawler, Allow/disallow, URL parameter, Restrictions
bypass):

```python
@dataclass
class CrawlConfig:
    # General
    start_url: str
    max_pages: int = 5000
    max_depth: int = 5
    include_subdomains: bool = False

    # Crawler
    user_agent: str = "VASchoolsBot/1.0 (+https://vaschools.edu.vn/bot)"
    respect_robots: bool = True          # với site VAS có thể tắt (site của mình)
    requests_per_second: float = 2.0
    timeout_seconds: int = 30
    render_js: Literal["never", "auto", "always"] = "auto"

    # Allow / disallow rules
    allow_patterns: list[str] = field(default_factory=list)
    disallow_patterns: list[str] = field(default_factory=list)

    # URL parameter rules
    ignore_params: list[str] = field(default_factory=lambda: [
        "utm_source", "utm_medium", "utm_campaign", "utm_term",
        "utm_content", "fbclid", "gclid", "ref",
    ])
    param_handling: Literal["keep", "strip_all", "strip_listed"] = "strip_listed"

    # Restrictions bypass (chỉ cho site của mình)
    basic_auth: tuple[str, str] | None = None
    custom_headers: dict[str, str] = field(default_factory=dict)
```

`respect_robots=False` **chỉ được phép** cho domain VAS (site của mình, có thể
cần crawl vùng staging chặn bot). Với domain đối thủ ở N2, luôn `True` — cưỡng
chế trong code, không để tùy chọn.

## Chuẩn hóa URL

Quyết định hai URL có phải một trang không. Sai ở đây gây crawl lặp vô tận
hoặc báo trùng lặp giả.

```
1. lowercase scheme + host
2. bỏ port mặc định (:80, :443)
3. bỏ fragment (#...)
4. bỏ tham số theo param_handling
5. sắp xếp tham số còn lại theo alphabet
6. chuẩn hóa dấu / cuối (thống nhất có hoặc không, theo cấu hình site)
7. decode percent-encoding không cần thiết
```

## Xử lý JavaScript

`render_js="auto"` — chỉ dùng Playwright khi cần, vì nó chậm hơn nhiều lần:

```python
def needs_js_render(html: str) -> bool:
    """True nếu HTML tĩnh gần như rỗng — dấu hiệu SPA."""
    # body text < 200 ký tự, hoặc chỉ có <div id="root|app"></div>
    # và có <script src> tới bundle
```

Trang render bằng JS đánh dấu `render_mode="js"`. Đây là thông tin cần cho SEO:
Google render được JS nhưng chậm hơn, và một số check (thin content) phải diễn
giải khác trên trang JS.

**Không báo lỗi `thin_content` hay `missing_h1` trên trang mà fetcher tĩnh trả
rỗng nhưng chưa thử Playwright** — đó là lỗi giả, và là cách nhanh nhất làm
mất niềm tin vào công cụ.

## Hiệu năng

| Kỹ thuật | Chi tiết |
|---|---|
| Async concurrency | 10 request song song mặc định, cấu hình được |
| Rate limit | Token bucket theo domain |
| Playwright pool | Tái dùng browser context, không mở mới mỗi trang |
| Streaming parse | Không giữ toàn bộ HTML trong RAM sau khi trích xong |
| Checkpoint | Lưu tiến độ định kỳ, crawl gián đoạn khôi phục được |

Site 5.000 trang, 10 luồng, 2 req/s: ước tính 45–60 phút nếu ít trang JS, dài
hơn đáng kể nếu nhiều.

## Endpoint

```
POST /api/v1/audits           body: CrawlConfig  → 202 + job_id
GET  /api/v1/audits/{id}      tổng quan
GET  /api/v1/audits/{id}/issues?severity=error&check_id=…
GET  /api/v1/audits/{id}/pages
```

## Edge case

| Tình huống | Xử lý |
|---|---|
| Site có bẫy vô hạn (lịch, filter) | Giới hạn `max_pages` + `max_depth` + phát hiện pattern lặp |
| Sitemap khai URL đã 404 | Vẫn crawl, ghi nhận là lỗi (đây là phát hiện có giá trị) |
| Không có sitemap | Crawl từ trang chủ theo link |
| Trang redirect sang domain khác | Ghi nhận, không crawl tiếp (ngoài phạm vi) |
| WAF chặn bot | Dừng, báo lỗi rõ ràng, gợi ý whitelist User-Agent |
| Crawl bị gián đoạn | Khôi phục từ checkpoint |
| Cùng nội dung ở nhiều URL do tham số | Chuẩn hóa URL xử lý; nếu vẫn lọt → `duplicate_content` |

## Nghiệm thu

- [ ] Crawl hết vaschools.edu.vn không bị lặp vô tận
- [ ] Trang render JS được xử lý đúng, không báo lỗi giả
- [ ] Check cần ngữ cảnh toàn site chạy đúng ở pha 2
- [ ] Chuẩn hóa URL không tạo trùng lặp giả
- [ ] Crawl gián đoạn khôi phục được
- [ ] Với domain không phải VAS, `respect_robots` bị cưỡng chế `True`
