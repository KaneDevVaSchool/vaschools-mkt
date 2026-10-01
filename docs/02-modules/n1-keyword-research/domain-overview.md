# Domain Overview

Trang tổng hợp mọi chỉ số của một domain. Đây là **màn hình tổng hợp**, không
có logic tính toán riêng — mọi số đến từ module khác.

## Yêu cầu gốc

Organic Search · Paid Search · Backlinks · Traffic Analytics · Top
Keywords/Pages · Competitors · Authority Score · AI Search.

## Nguồn từng khối

| Khối | Nguồn | Nhãn | Trạng thái MVP |
|---|---|---|---|
| Organic Keywords / Traffic | [organic-research.md](organic-research.md) | `ESTIMATED` | Có |
| Traffic Value / Cost | [organic-research.md](organic-research.md) | `ESTIMATED` | Có |
| Top Keywords | `rankings` + `keyword_metrics` | `OBSERVED`/`VENDOR` | Có |
| Top Pages | `traffic_estimates` gộp theo URL | `ESTIMATED` | Có |
| Competitors | [competitor-detection.md](competitor-detection.md) | `ESTIMATED` | Có (chỉ domain đã duyệt) |
| Backlinks | [backlink-provider.md](../../04-integrations/backlink-provider.md) (N2) | `VENDOR` | Có |
| Authority Score | Backlink provider | `VENDOR` | Có |
| Traffic Analytics (GA4) | [ga4.md](../../04-integrations/ga4.md) | `MEASURED` | Có — chỉ cho domain VAS |
| **Paid Search** | — | — | **Ngoài MVP** |
| **AI Search** | — | — | **Phase 2** |

Với domain đối thủ, khối GA4 không tồn tại (không có quyền truy cập) — đó
chính là lý do cần Organic Traffic ước tính.

## Bố cục

```
┌────────────────────────────────────────────────────────────┐
│  vaschools.edu.vn                        [Authority: 34]   │
│  ⚠ Số liệu Organic là ƯỚC TÍNH, không thay thế GA4         │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Organic KW   │ Organic      │ Traffic      │ Backlinks     │
│ 342          │ Traffic      │ Value        │ 1.204         │
│ [ƯỚC TÍNH]   │ 12.400       │ 185tr VND    │ [NHÀ CUNG CẤP]│
│              │ [ƯỚC TÍNH]   │ [ƯỚC TÍNH]   │               │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  So sánh với GA4 (chỉ domain VAS)                          │
│  Ước tính 12.400  ·  GA4 thật 15.800 [THẬT]  ·  đạt 78%    │
├────────────────────────────────────────────────────────────┤
│  Biểu đồ xu hướng Organic Traffic theo tháng               │
├─────────────────────────────┬──────────────────────────────┤
│  Top Keywords               │  Top Pages                   │
├─────────────────────────────┼──────────────────────────────┤
│  Competitors (đã duyệt)     │  Phân bố Intent              │
└─────────────────────────────┴──────────────────────────────┘
```

Khối so sánh GA4 đặt **ngay dưới** các thẻ ước tính, không giấu ở cuối trang.

## Endpoint

```
GET /api/v1/domains/{domain}/overview
```

Gộp nhiều nguồn trong một response. Mọi khối đều có thể vắng mặt (`null` +
`note`) — không được để một khối thiếu dữ liệu làm hỏng cả trang.

```json
{
  "data": {
    "domain": "vaschools.edu.vn",
    "is_our_domain": true,
    "organic":  { "...": "..." },
    "backlinks": {
      "total":          { "value": 1204, "provenance": "VENDOR" },
      "referring_domains": { "value": 187, "provenance": "VENDOR" },
      "authority_score":   { "value": 34, "provenance": "VENDOR" }
    },
    "ga4": { "organic_sessions": { "value": 15800, "provenance": "MEASURED" } },
    "paid_search": { "value": null, "note": "Ngoài phạm vi MVP" },
    "ai_search":   { "value": null, "note": "Phase 2" }
  }
}
```

Hai khối cuối trả `null` + `note` thay vì bỏ hẳn — người dùng cần biết tính
năng tồn tại nhưng chưa làm, thay vì tưởng bị lỗi.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Domain chưa từng crawl | `422 NO_DATA_YET` + nút xếp job |
| Domain đối thủ (không có GA4) | Ẩn khối GA4, không hiện lỗi |
| Backlink provider chưa tích hợp | Khối backlink `null` + "Đang tích hợp" |
| Domain không xếp hạng từ khóa nào | Hiện 0, giải thích do độ phủ bộ nền |

## Nghiệm thu

- [ ] Một khối thiếu dữ liệu không làm hỏng cả trang
- [ ] Khối so sánh GA4 đặt ngay cạnh số ước tính
- [ ] Paid Search / AI Search hiện rõ là chưa có, không phải lỗi
- [ ] Chỉ hiện đối thủ đã duyệt
- [ ] Trang hoạt động với cả domain VAS và domain đối thủ
