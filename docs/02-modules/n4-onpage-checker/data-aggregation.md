# Chuẩn hóa dữ liệu cho AI

Bước 2 trong kiến trúc 6 bước: gộp dữ liệu từ nhiều nguồn thành **một payload
có cấu trúc nhất quán** cho từng URL.

## Vấn đề

Mỗi module có schema riêng: Site Audit trả findings, N1 trả rankings và
keyword metrics, N2 trả backlinks và content gap, GA4 trả metrics theo
dimension. Gửi thẳng vào prompt sẽ vừa nhiễu vừa không nhất quán.

## Payload chuẩn

Một cấu trúc duy nhất, mọi nhóm ý tưởng dùng chung:

```python
# core/models.py
@dataclass(frozen=True)
class OnpagePayload:
    url: str
    fetched_at: datetime

    page: PageContent          # từ N3 crawl
    technical: TechnicalFacts  # từ N3 audit + PSI
    keywords: KeywordFacts     # từ N1
    serp: SerpFacts            # từ N1
    competitors: CompetitorFacts | None   # từ N2, có thể vắng
    backlinks: BacklinkFacts | None       # từ N2, có thể vắng
    analytics: AnalyticsFacts | None      # từ GA4, có thể vắng
```

Ba trường cuối `| None` — đây là cách N4 chạy được khi module nền chưa xong.
Nhóm ý tưởng nào cần trường vắng mặt thì bỏ qua, không làm hỏng cả job.

## Chi tiết từng lát

```python
@dataclass(frozen=True)
class PageContent:
    title: str | None
    meta_description: str | None
    headings: list[Heading]        # (level, text), giữ thứ bậc
    content_summary: str           # trích xuất, KHÔNG phải toàn văn
    word_count: int
    images: ImageStats
    internal_links: int
    schema_types: list[str]
    render_mode: Literal["html", "js"]

@dataclass(frozen=True)
class TechnicalFacts:
    findings: list[Finding]        # từ error-catalog
    core_web_vitals: CwvMetrics | None
    performance_score: int | None

@dataclass(frozen=True)
class KeywordFacts:
    target_keywords: list[KeywordMetric]   # kw + volume + intent + vị trí
    cluster_keywords: list[str]            # cùng cluster, chưa dùng trên trang
    paa_questions: list[str]               # People Also Ask

@dataclass(frozen=True)
class SerpFacts:
    our_position: int | None
    top_10: list[SerpResult]       # vị trí, domain, title
    features_present: list[str]
    features_owned_by_competitors: dict[str, str]
```

## Quy tắc chuẩn hóa

| Quy tắc | Lý do |
|---|---|
| **Tóm tắt, không gửi toàn văn** | `content_summary` = heading + đoạn đầu mỗi mục. Giảm token và giảm nhiễu prompt |
| **Giới hạn số lượng** | Tối đa 10 từ khóa mục tiêu, 10 kết quả SERP, 20 findings nghiêm trọng nhất |
| **Mọi số kèm nhãn nguồn** | Để LLM biết cái nào chắc chắn, cái nào ước tính |
| **Không gửi HTML thô** | Đã parse rồi mới gửi |
| **Trường vắng mặt là `None`, không phải chuỗi rỗng** | Phân biệt "không có dữ liệu" và "có nhưng rỗng" |
| **Timestamp mọi lát** | Dữ liệu từ các module có thể crawl ở thời điểm khác nhau |

Quy tắc thứ hai đáng nhấn mạnh: "cần chọn lọc dữ liệu SERP liên quan nhất,
tránh đưa quá nhiều dữ liệu gây nhiễu prompt" là khó khăn đã nêu ở tuần 3
trong tài liệu gốc. Nhồi thêm dữ liệu không làm gợi ý tốt hơn.

## Chọn từ khóa mục tiêu cho một URL

Không hiển nhiên — một URL có thể xếp hạng cho hàng chục từ khóa.

```
1. Từ khóa URL đang xếp hạng cao nhất (từ rankings)
2. Từ khóa có volume cao nhất trong số đó
3. Nếu người dùng chỉ định target_keywords → ưu tiên
4. Tối đa 10, sắp theo volume × (1/vị trí)
```

## Xây dựng payload

```python
# llm/payload_builder.py
async def build_payload(url: str, target_keywords: list[str] | None) -> OnpagePayload:
    """Gộp từ DB. KHÔNG gọi API ngoài — dữ liệu phải đã crawl sẵn."""
```

Nếu thiếu dữ liệu nền quan trọng (chưa crawl trang, chưa có SERP), trả
`422 NO_DATA_YET` kèm danh sách job cần chạy trước — không tự động xếp job và
bắt người dùng chờ vô định.

## Cache

Chi phí LLM đáng kể, và payload thường không đổi giữa hai lần chạy gần nhau.

```
cache_key = hash(payload)     # hash toàn bộ payload đã chuẩn hóa
```

Payload không đổi → trả kết quả cũ, không gọi LLM. Điều này khiến việc chạy
lại để xem kết quả trở nên miễn phí, và là cơ chế kiểm soát chi phí LLM chính.

## Nghiệm thu

- [ ] Một cấu trúc payload duy nhất cho cả 7 nhóm
- [ ] Module nền vắng mặt không làm hỏng job
- [ ] Không gửi HTML thô hay toàn văn nội dung
- [ ] Giới hạn số lượng được áp dụng
- [ ] Cache theo hash payload hoạt động
- [ ] `build_payload` không gọi API ngoài
