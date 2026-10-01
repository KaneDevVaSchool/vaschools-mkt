# Keyword Overview

Tra cứu tối đa **100 từ khóa/lần**, hiển thị các chỉ số chính, xem chi tiết
từng từ khóa.

## Endpoint

```
POST /api/v1/keywords/overview
```

Request:

```json
{
  "keywords": ["trường quốc tế tphcm", "học phí trường quốc tế"],
  "location": "VN",
  "language": "vi",
  "device": "desktop"
}
```

Ràng buộc: `len(keywords) <= 100`. Vượt → `400 TOO_MANY_KEYWORDS`. Đây là giới
hạn của SERP API, phản ánh thẳng vào API của ta để tránh hiểu nhầm.

Response (rút gọn):

```json
{
  "data": [{
    "keyword": "trường quốc tế tphcm",
    "keyword_id": 1024,
    "search_volume":       { "value": 2400, "provenance": "VENDOR" },
    "keyword_difficulty":  { "value": null, "provenance": "VENDOR",
                             "note": "Không có trong gói hiện tại" },
    "cpc":                 { "value": 12500, "unit": "VND", "provenance": "VENDOR" },
    "competitive_density": { "value": 0.42, "provenance": "VENDOR" },
    "results_count":       { "value": 4820000, "provenance": "OBSERVED" },
    "intent":              { "value": "commercial", "provenance": "ESTIMATED",
                             "confidence": 0.86 },
    "trend": { "value": [1900, 2100, 2400, 2400, 2600, 2400],
               "period": "monthly_6m", "provenance": "VENDOR" },
    "our_position":        { "value": 7, "provenance": "OBSERVED" },
    "position_change":     { "value": 2, "provenance": "OBSERVED" },
    "serp_features":       { "value": ["people_also_ask", "local_pack"],
                             "provenance": "OBSERVED" }
  }],
  "meta": { "data_fetched_at": "2026-09-28T02:00:00Z", "is_stale": false }
}
```

## Các chỉ số và nguồn

| Chỉ số | Nguồn | Nhãn | Ghi chú |
|---|---|---|---|
| Search Volume | Keyword Planner / DataForSEO | `VENDOR` | 70–85% |
| Keyword Difficulty | Provider (nếu mua) | `VENDOR` | **Optional.** Không mua → `null`, không tự tính |
| CPC | Keyword Planner | `VENDOR` | VND |
| Competitive Density | Keyword Planner | `VENDOR` | 0–1 |
| Results / Competition | `serp_snapshots` | `OBSERVED` | Đếm từ response |
| Intent | LLM | `ESTIMATED` | Kèm `confidence` |
| Trend | Keyword Planner | `VENDOR` | 6 hoặc 12 tháng |
| Vị trí VAS hiện tại | `rankings` | `OBSERVED` | `null` nếu ngoài Top 100 |
| Thay đổi vị trí | `rankings` (2 snapshot) | `OBSERVED` | Dương = cải thiện |
| SERP Features | `serp_snapshots` | `OBSERVED` | — |

## Luồng xử lý

```
1. Chuẩn hóa từ khóa (lowercase, trim, gộp khoảng trắng, bỏ dấu câu thừa)
2. Tra keywords theo (normalized_text, location, language)
   - Đã có  → lấy keyword_id
   - Chưa có → tạo bản ghi mới, trạng thái pending
3. Với keyword đã có dữ liệu tươi → đọc thẳng từ DB, trả về ngay
4. Với keyword thiếu dữ liệu → xếp job fetch_serp_batch + fetch_keyword_metrics
   Trả về phần đã có, kèm meta.pending_keywords
5. Frontend poll cho phần còn thiếu
```

**Không gọi API ngoài trong request.** Nếu không có dữ liệu nào, trả
`422 NO_DATA_YET` kèm `job_id` đã xếp hàng.

## Chuẩn hóa từ khóa

Hàm `core/urls.py::normalize_keyword`. Một từ khóa được coi là trùng khi:

```
lowercase → trim → gộp nhiều khoảng trắng thành một
→ bỏ dấu câu ở hai đầu → giữ nguyên dấu tiếng Việt
```

**Giữ nguyên dấu tiếng Việt.** "học phí" và "hoc phi" là **hai từ khóa khác
nhau** — chúng có volume và SERP khác nhau trong thực tế. Đây là điểm dễ sai
với dữ liệu tiếng Việt.

Khóa duy nhất: `(normalized_text, location, language)`.

## Chi tiết một từ khóa

```
GET /api/v1/keywords/{id}
GET /api/v1/keywords/{id}/serp      → SERP Simulation
GET /api/v1/keywords/{id}/history   → Lịch sử vị trí
```

SERP Simulation hiển thị lại response thô: Top 10 (vị trí, title, URL,
description, domain), các SERP feature hiện diện, và thời điểm crawl. Không xử
lý thêm — nhãn `OBSERVED`.

## Giao diện

Bảng, mặc định 5 cột: **từ khóa · volume · intent · vị trí · traffic value**.
Cột khác ẩn sau nút "Cột" (tránh rối mắt — khó khăn đã nêu ở tuần 4 tài liệu gốc).

| Thành phần | Yêu cầu |
|---|---|
| Ô nhập | Textarea, mỗi dòng một từ khóa, đếm số dòng, cảnh báo khi > 100 |
| Mỗi ô số | Qua `<MetricCell>`, có `<ProvenanceBadge>` |
| KD% khi không có | Hiển thị `—` + tooltip "Không có trong gói hiện tại. Tham khảo cột Số kết quả." |
| Intent | Chip màu theo I/N/C/T, tooltip hiện `confidence` |
| Trend | Sparkline |
| Sort/lọc | Mọi cột số; lọc theo intent, khoảng volume |
| Export CSV | Kèm cột nhãn nguồn + chân trang cảnh báo |
| Trạng thái pending | Dòng hiện skeleton, tự cập nhật khi job xong |

## Edge case

| Tình huống | Xử lý |
|---|---|
| Từ khóa không có volume (quá hiếm) | `value: null`, note "Volume quá thấp để đo" — không hiển thị 0 |
| VAS không xếp hạng trong Top 100 | `our_position: null`, note "Ngoài Top 100" |
| Chỉ crawl 1 lần, chưa có lịch sử | `position_change: null`, note "Chưa đủ dữ liệu lịch sử" |
| Từ khóa trùng trong input | Dedupe sau chuẩn hóa, trả về 1 dòng |
| Input rỗng / toàn khoảng trắng | `400 VALIDATION_ERROR` |
| Snapshot cũ hơn ngưỡng tier | Vẫn trả, `is_stale: true`, banner cảnh báo |

## Nghiệm thu

- [ ] Tra 100 từ khóa/lần, vượt thì báo lỗi rõ ràng
- [ ] Mọi ô số có nhãn nguồn hiển thị
- [ ] KD% vắng mặt không làm hỏng bảng, hiển thị `—` có giải thích
- [ ] Từ khóa mới tự xếp job, không chặn UI
- [ ] Export CSV có cột nhãn nguồn + chân trang
- [ ] Phân biệt được từ khóa tiếng Việt có dấu / không dấu
