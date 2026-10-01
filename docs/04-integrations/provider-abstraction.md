# Lớp trừu tượng nhà cung cấp

> **Rủi ro đã xác định**: "Phụ thuộc nhà cung cấp SERP API bên thứ ba — giá &
> điều khoản có thể thay đổi. Nên tài liệu hóa để dễ chuyển đổi nhà cung cấp."

Lớp adapter là cách thực thi điều đó trong code. Rẻ khi làm ngay từ đầu, rất
đắt khi thêm vào sau.

## Nguyên tắc

**`providers/` là nơi duy nhất trong toàn codebase gọi HTTP ra ngoài.**

Mọi thứ khác — analytics, api, jobs — làm việc với model nội bộ. Đổi nhà cung
cấp = thêm một class, không sửa dòng nghiệp vụ nào.

## Cấu trúc

```
providers/
├── base.py                  Protocol cho từng loại
├── serp/
│   ├── dataforseo.py
│   ├── serpapi.py
│   └── fake.py              ⚠ bắt buộc có
├── keyword_planner/
├── backlinks/
├── pagespeed/
└── ga4/
```

Mỗi loại provider có **ít nhất hai** implementation: một thật, một `fake`.

## Protocol

```python
# providers/base.py
class SerpProvider(Protocol):
    name: str

    async def fetch_serp(
        self, keywords: list[str], location: str, language: str,
        device: str, depth: int = 100,
    ) -> list[SerpResponse]:
        """Tối đa 100 từ khóa. Trả model nội bộ, KHÔNG phải JSON thô."""

    def estimate_cost(self, keyword_count: int) -> Decimal:
        """Chi phí ước tính USD — để quota guard kiểm tra TRƯỚC khi gọi."""
```

`estimate_cost` là phần dễ bỏ sót nhưng cần thiết: quota guard phải biết một
lời gọi tốn bao nhiêu trước khi thực hiện nó.

## Model nội bộ

Adapter chuẩn hóa mọi provider về cùng một hình dạng:

```python
@dataclass(frozen=True)
class SerpResponse:
    keyword: str
    location: str
    language: str
    device: str
    results: list[SerpResult]      # vị trí, url, domain, title, description
    features: list[str]            # tên chuẩn hóa, xem bảng dưới
    results_count: int | None
    provider: str
    fetched_at: datetime
    raw: dict                      # ⚠ giữ nguyên response gốc
```

Giữ `raw`: nếu sau này cần một trường chưa parse, không phải crawl lại.

### Chuẩn hóa tên SERP feature

Mỗi provider đặt tên khác nhau. Ánh xạ về bộ tên chuẩn nội bộ:

```
featured_snippet · people_also_ask · local_pack · image_pack
video · shopping · knowledge_panel · sitelinks · top_ads · bottom_ads
```

Ánh xạ nằm trong từng adapter, không rò rỉ ra ngoài.

## Provider `fake` — bắt buộc

```python
class FakeSerpProvider:
    """Đọc từ tests/fixtures/. Không gọi mạng. Kết quả tất định."""
```

Ba lý do bắt buộc có:

1. **Phát triển không đốt quota.** Dev chạy cả ngày không tốn tiền.
2. **Test tất định.** Không phụ thuộc mạng hay trạng thái provider.
3. **Không bị chặn bởi hợp đồng.** N4 Backlink Ideas phát triển được trước
   khi ký hợp đồng backlink.

Fixture lấy từ response thật đã ghi lại, đủ đa dạng: có/không SERP feature,
kết quả rỗng, lỗi 429, schema lạ.

## Chọn provider lúc chạy

```python
# core/config.py
SERP_PROVIDER = env("SERP_PROVIDER", default="fake")
```

```python
def get_serp_provider() -> SerpProvider:
    return {
        "dataforseo": DataForSeoProvider,
        "serpapi": SerpApiProvider,
        "fake": FakeSerpProvider,
    }[settings.SERP_PROVIDER]()
```

Mặc định `fake` — quên cấu hình thì không đốt tiền, thay vì ngược lại.

## Xử lý lỗi — chuẩn hóa

Adapter chuyển lỗi của provider thành exception nội bộ:

| Exception | Khi nào | Job làm gì |
|---|---|---|
| `ProviderRateLimited` | 429 | Backoff, retry, giảm tốc toàn worker |
| `ProviderUnavailable` | 5xx, timeout | Retry 3 lần, sau đó đánh dấu failed |
| `ProviderAuthError` | 401/403 | Dừng ngay, cảnh báo — retry vô ích |
| `ProviderQuotaExceeded` | Hết quota phía provider | Dừng mọi job tiêu quota |
| `ProviderSchemaError` | Response không đúng schema mong đợi | **Dừng job, cảnh báo, KHÔNG ghi dữ liệu méo** |

`ProviderSchemaError` quan trọng nhất: provider đổi format là chuyện xảy ra
thật. Ghi dữ liệu parse sai vào raw store còn tệ hơn dừng job — vì dữ liệu
méo sẽ lan vào mọi tính toán phía sau và rất khó phát hiện sau đó.

## Chuyển đổi nhà cung cấp — quy trình

Nếu giá hoặc điều khoản thay đổi:

```
1. Viết adapter mới (implement Protocol)
2. Ghi fixture từ response thật của provider mới
3. Chạy bộ test contract chung cho mọi provider
4. So sánh song song: chạy cả hai trên 100 từ khóa, đối chiếu kết quả
5. Đổi SERP_PROVIDER trong env
6. Dữ liệu cũ giữ nguyên — mỗi bản ghi có cột provider
```

Bước 4 quan trọng: số liệu giữa hai provider sẽ khác nhau. Ghi lại mức chênh
lệch để chú thích khi so sánh dữ liệu trước/sau chuyển đổi.

## Test contract chung

```python
# tests/integration/test_provider_contract.py
@pytest.mark.parametrize("provider", [FakeSerpProvider(), ...])
async def test_serp_provider_contract(provider):
    """Mọi implementation phải thỏa cùng bộ ràng buộc."""
    # trả đúng số lượng, giữ thứ tự, feature đúng tên chuẩn,
    # raw không rỗng, fetched_at có timezone, lỗi đúng exception type
```

Adapter mới chỉ được chấp nhận khi qua bộ test này.

## Nghiệm thu

- [ ] `providers/` là nơi duy nhất gọi HTTP ra ngoài (kiểm bằng lint rule)
- [ ] Mỗi loại provider có `fake` implementation
- [ ] Mặc định env là `fake`
- [ ] `estimate_cost` hoạt động, quota guard dùng được
- [ ] Test contract chung chạy cho mọi provider
- [ ] `ProviderSchemaError` dừng job, không ghi dữ liệu méo
- [ ] Mọi bản ghi raw có cột `provider`
