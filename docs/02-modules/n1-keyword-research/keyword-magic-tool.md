# Keyword Magic Tool

Mở rộng & phân nhánh từ khóa gốc theo 4 loại match, phân loại intent I/N/C/T.

**Phân loại**: Hybrid — nguồn từ Google Suggest + SERP API (Buy), thuật toán mở
rộng và phân nhóm Topic Cluster tự Build. Bộ lọc Match Type là **Build thuần**,
không gọi thêm API.

## Endpoint

```
POST /api/v1/keywords/magic
```

```json
{
  "seed": "trường quốc tế",
  "match_type": "broad",
  "filters": {
    "intent": ["commercial", "transactional"],
    "volume_min": 100,
    "volume_max": null,
    "include_words": ["tphcm"],
    "exclude_words": ["tuyển dụng", "việc làm"]
  },
  "limit": 200
}
```

Response: danh sách từ khóa kèm chỉ số (như Keyword Overview) + `topic_cluster`.

## Thuật toán mở rộng

Chạy trong job `expand_seed_keywords`, không trong request.

```
Đầu vào: seed keyword

B1. Google Suggest — 4 biến thể truy vấn:
    a) seed
    b) seed + mỗi chữ cái a-z          → "trường quốc tế a", "…b", …
    c) mỗi từ để hỏi + seed            → "trường quốc tế nào tốt", "học phí …"
    d) seed + mỗi từ bổ nghĩa ngành     → "… tphcm", "… song ngữ", "… học phí"

B2. Trích từ SERP đã crawl của seed:
    - People Also Ask (câu hỏi liên quan)
    - Related searches ở cuối trang
    - Từ khóa trong title Top 10

B3. Gộp + chuẩn hóa + dedupe (normalize_keyword)

B4. Lọc rác:
    - Độ dài < 3 ký tự hoặc > 100 ký tự
    - Chứa từ trong danh sách chặn (xem dưới)
    - Không liên quan ngành (kiểm tra bằng từ khóa ngành)

B5. Xếp job lấy volume/CPC + phân loại intent cho từ khóa mới

B6. Gán topic cluster (xem mục Topic Cluster)
```

**Từ để hỏi tiếng Việt** (B1c): `nào`, `gì`, `ở đâu`, `bao nhiêu`, `tại sao`,
`như thế nào`, `khi nào`, `có tốt không`, `review`, `đánh giá`, `so sánh`.

**Từ bổ nghĩa ngành giáo dục** (B1d): `học phí`, `tuyển sinh`, `chương trình`,
`song ngữ`, `quốc tế`, `mầm non`, `tiểu học`, `thcs`, `thpt`, `nội trú`,
`bán trú`, `tphcm`, `hà nội`, `gần đây`, `tốt nhất`, `top`, `bảng xếp hạng`.

**Danh sách chặn**: `tuyển dụng`, `việc làm`, `tuyển giáo viên`, `lương`,
`download`, `torrent`, `phim`, `game`. Bổ sung dần — lưu trong
`analytics/blocklist.py`, không hardcode rải rác.

## Bộ lọc Match Type — Build thuần

`analytics/match_type.py`. Hàm thuần, không I/O. Áp dụng **sau khi** đã mở rộng,
không gọi thêm API.

Gọi `S` = tập từ đã chuẩn hóa của seed, `K` = của từ khóa ứng viên.

| Match type | Điều kiện | Ví dụ với seed "trường quốc tế" |
|---|---|---|
| `exact` | `K == S` (sau chuẩn hóa) | "trường quốc tế" |
| `phrase` | Chuỗi seed xuất hiện **liền mạch, đúng thứ tự** trong từ khóa | "trường quốc tế tphcm", "top trường quốc tế" |
| `broad` | **Mọi từ** trong seed đều có mặt, thứ tự bất kỳ, có thể xen kẽ | "trường mầm non quốc tế", "quốc tế trường nào tốt" |
| `related` | **Không** thỏa broad, nhưng cùng topic cluster hoặc chia sẻ ≥1 domain trong Top 10 SERP | "học phí song ngữ", "international school hcm" |

Quan hệ bao hàm: `exact ⊆ phrase ⊆ broad`, và `related ∩ broad = ∅`.

Cách xác định `related` (điểm cần cẩn thận): dùng **SERP overlap** — nếu Top 10
của từ khóa ứng viên và Top 10 của seed chia sẻ ≥ 3 domain, hai từ khóa được
Google coi là cùng chủ đề. Đây là tín hiệu tốt hơn so khớp chuỗi thuần.

```python
def serp_overlap(kw_a_top10: set[str], kw_b_top10: set[str]) -> int:
    return len(kw_a_top10 & kw_b_top10)

# related nếu overlap >= 3 và không thỏa broad
```

## Topic Cluster

Nhóm từ khóa cùng chủ đề, dùng lại cho Keyword Strategy Builder.

```
B1. Với mỗi từ khóa, lấy tập domain Top 10 từ serp_snapshots
B2. Xây đồ thị: cạnh giữa 2 từ khóa nếu serp_overlap >= 3
B3. Tìm connected component → mỗi component là 1 cluster
B4. Đặt tên cluster = từ khóa có volume cao nhất trong component
```

Ưu điểm của cách này so với gom nhóm bằng ngữ nghĩa: dựa trên **hành vi thật
của Google**, không dựa trên phán đoán của mô hình. Nếu Google trả cùng bộ kết
quả cho hai truy vấn, chúng thuộc cùng một chủ đề — bất kể câu chữ khác nhau.

Từ khóa chưa có SERP snapshot: tạm gán cluster theo từ chung, đánh dấu
`cluster_method = "lexical"` để phân biệt với `"serp_overlap"`.

## Phân loại Intent

Xem [intent-taxonomy.md](../../03-data/intent-taxonomy.md) cho định nghĩa và
[prompt-templates.md](../../05-llm/prompt-templates.md) cho prompt.

Tóm tắt: LLM gán nhãn theo lô 50 từ khóa/request, output JSON có schema cố
định, kèm `confidence`. Nhãn `ESTIMATED`. Kết quả cache theo
`normalize_keyword` — một từ khóa chỉ phân loại một lần.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Ô nhập seed | Một từ khóa |
| Tab match type | 4 tab Broad/Phrase/Exact/Related, hiện số lượng mỗi tab |
| Cây topic cluster | Sidebar trái, click để lọc bảng |
| Bộ lọc | Intent (chip multi-select), khoảng volume, chứa/không chứa từ |
| Bảng kết quả | Như Keyword Overview |
| Chọn nhiều + gửi sang Strategy Builder | Tối đa 5 từ khóa |

Bộ lọc phải nằm trong URL search params để chia sẻ được link.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Seed không có gợi ý nào | Trả danh sách rỗng + gợi ý thử seed rộng hơn |
| Mở rộng ra > 5.000 từ khóa | Cắt theo volume giảm dần, cảnh báo đã cắt |
| Từ khóa mới chưa có volume | Hiển thị, volume `null`, đánh dấu "đang lấy dữ liệu" |
| Related nhưng chưa có SERP snapshot | Rơi về so khớp từ vựng, ghi rõ `cluster_method` |
| Seed tiếng Anh, thị trường VN | Vẫn chạy — nhiều phụ huynh tìm bằng tiếng Anh |

## Nghiệm thu

- [ ] 4 tab match type cho kết quả khác nhau, đúng quan hệ bao hàm
- [ ] `exact ⊆ phrase ⊆ broad` kiểm chứng bằng test
- [ ] Related dựa trên SERP overlap, không chỉ so khớp chuỗi
- [ ] Topic cluster gom được từ khóa khác câu chữ nhưng cùng chủ đề
- [ ] Danh sách chặn lọc được từ khóa tuyển dụng/việc làm
- [ ] Lọc intent hoạt động, hiển thị confidence
