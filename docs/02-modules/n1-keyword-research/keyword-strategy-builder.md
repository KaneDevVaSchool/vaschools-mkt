# Keyword Strategy Builder

Nhập **tối đa 5 từ khóa**, tự động nhóm theo mô hình Pillar Page / Cluster
Content, gợi ý triển khai bài viết SEO.

**Phân loại**: Hybrid — clustering theo topic tự Build (dùng SERP overlap từ
Keyword Magic Tool), LLM sinh outline/gợi ý bài viết.

> Nằm ở vị trí **số 3** trong thứ tự cắt giảm nếu chậm tiến độ. Không phải
> blocker cho module nào khác.

## Endpoint

```
POST /api/v1/keywords/strategy
```

```json
{ "keywords": ["trường quốc tế tphcm", "học phí trường quốc tế"],
  "our_domain": "vaschools.edu.vn" }
```

Ràng buộc: `len(keywords) <= 5`.

Trả `202` + `job_id` — có gọi LLM nên chạy nền.

## Mô hình Pillar / Cluster

```
        ┌─────────────────────────────┐
        │  PILLAR PAGE                │
        │  "trường quốc tế tphcm"     │  ← volume cao nhất, intent rộng
        │  bao quát toàn chủ đề       │
        └──────────────┬──────────────┘
                       │ internal link 2 chiều
     ┌─────────────┬───┴────┬──────────────┐
     ▼             ▼        ▼              ▼
 CLUSTER 1    CLUSTER 2  CLUSTER 3    CLUSTER 4
 "học phí…"   "chương    "tuyển       "so sánh
              trình…"     sinh…"       trường…"
 intent: C    intent: I   intent: T    intent: C
```

## Thuật toán chọn Pillar và Cluster

```
B1. Mở rộng mỗi từ khóa đầu vào bằng Keyword Magic Tool (tái dùng, không viết lại)
B2. Gom cụm bằng SERP overlap (tái dùng topic cluster)
B3. Chọn Pillar cho mỗi cụm:
    điểm_pillar = volume_chuẩn_hóa * 0.5
                + độ_rộng_chủ_đề   * 0.3    (số từ khóa con phủ được)
                + ưu_tiên_intent   * 0.2    (I/C > T/N cho trang trụ cột)
    → từ khóa điểm cao nhất làm Pillar
B4. Từ khóa còn lại trong cụm → Cluster, nhóm theo intent
B5. Với mỗi Cluster: kiểm tra VAS đã có trang nào xếp hạng chưa
    (tra rankings theo domain) → gắn trạng thái:
       "đã có trang"  / "cần tạo mới" / "cần tối ưu"
B6. Gọi LLM sinh outline + gợi ý triển khai (xem dưới)
```

Bước B5 quan trọng: gợi ý "tạo bài mới" cho chủ đề VAS đã có trang là lời
khuyên sai, dễ gây trùng lặp nội dung (cannibalization).

## Phần LLM sinh

Với mỗi Pillar và Cluster, LLM nhận payload đã chuẩn hóa và sinh:

| Trường | Nội dung |
|---|---|
| `suggested_title` | Tiêu đề bài đề xuất |
| `outline` | Danh sách H2/H3 |
| `target_keywords` | Từ khóa chính + phụ (lấy từ dữ liệu, **không** do LLM bịa) |
| `content_angle` | Góc tiếp cận, dựa trên khoảng trống so với Top 10 |
| `internal_links` | Liên kết nội bộ nên đặt (Pillar ↔ Cluster) |
| `estimated_effort` | `thấp` / `trung bình` / `cao` |

**LLM không sinh số liệu.** Volume, vị trí, số từ khóa đều lấy từ DB và chèn
vào payload. LLM chỉ sinh văn bản. Xem
[llm-usage-policy.md](../../05-llm/llm-usage-policy.md).

Payload gửi LLM gồm: từ khóa cụm + volume + intent, Top 10 SERP hiện tại (title
+ domain), trang VAS đang có (nếu có), và khoảng trống nội dung nếu N2 đã chạy.

## Output

```json
{
  "clusters": [{
    "pillar": {
      "keyword": "trường quốc tế tphcm",
      "search_volume": { "value": 2400, "provenance": "VENDOR" },
      "our_status": "cần tối ưu",
      "existing_url": "https://vaschools.edu.vn/gioi-thieu",
      "suggested_title": "…",
      "outline": ["…"],
      "review_status": "pending_review"
    },
    "clusters": [ { "keyword": "học phí trường quốc tế", "...": "..." } ],
    "total_volume": { "value": 8900, "provenance": "VENDOR" },
    "cluster_method": "serp_overlap"
  }],
  "meta": { "data_fetched_at": "…" }
}
```

Mọi mục có `review_status: pending_review` — phải qua chuyên gia SEO duyệt
trước khi hiển thị như khuyến nghị chính thức. Xem
[human-review-workflow.md](../../05-llm/human-review-workflow.md).

## Giao diện

- Sơ đồ cây Pillar → Cluster (một cụm một thẻ).
- Mỗi nút hiện: từ khóa, volume, intent, trạng thái VAS (`đã có` / `cần tạo` /
  `cần tối ưu`) bằng màu.
- Click nút → panel bên phải hiện outline, gợi ý, nút duyệt/từ chối.
- Nội dung chưa duyệt hiển thị banner "Gợi ý AI — chưa qua chuyên gia duyệt".
- Export kế hoạch nội dung ra CSV.

## Edge case

| Tình huống | Xử lý |
|---|---|
| 5 từ khóa thuộc 5 cụm rời rạc | Trả 5 cụm độc lập, ghi chú không liên quan nhau |
| 5 từ khóa cùng 1 cụm | 1 Pillar + 4 Cluster |
| Từ khóa chưa có SERP snapshot | Xếp job crawl trước, job strategy chờ |
| VAS đã xếp hạng tốt (Top 3) cho Pillar | Trạng thái "đã có", gợi ý tập trung vào Cluster |
| LLM trả JSON sai schema | Retry 1 lần; vẫn sai → trả phần dữ liệu (cụm + volume), bỏ phần gợi ý, ghi rõ |

## Nghiệm thu

- [ ] Tối đa 5 từ khóa, vượt thì báo lỗi
- [ ] Cụm gom theo SERP overlap, không chỉ theo từ chung
- [ ] Phát hiện đúng trang VAS đã có, không gợi ý tạo trùng
- [ ] Mọi gợi ý LLM ở trạng thái `pending_review`
- [ ] LLM không sinh ra con số nào
