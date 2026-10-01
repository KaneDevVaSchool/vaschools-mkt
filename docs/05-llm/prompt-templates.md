# Prompt Templates

Mọi prompt lưu tại `backend/src/vaschools_mkt/llm/prompts/<tên>.v<N>.md`.

## Khung chung

Mọi prompt theo cùng cấu trúc:

```
1. VAI TRÒ        — chuyên gia SEO ngành giáo dục Việt Nam
2. NHIỆM VỤ       — cụ thể, một việc
3. DỮ LIỆU        — payload JSON đã chuẩn hóa
4. RÀNG BUỘC      — cấm bịa số, cấm khẳng định về VAS, phải dẫn nguồn
5. ĐỊNH DẠNG      — JSON schema cố định
```

Khối RÀNG BUỘC dùng chung cho mọi prompt:

```markdown
## Ràng buộc bắt buộc

- CHỈ dùng dữ liệu trong phần DỮ LIỆU. Không suy diễn, không dùng kiến thức
  ngoài về VA Schools hay các trường được nhắc tới.
- KHÔNG đưa ra bất kỳ con số nào không có sẵn trong DỮ LIỆU. Không ước tính,
  không dự báo, không tính toán.
- KHÔNG khẳng định VA Schools có hay không có chương trình, cơ sở vật chất,
  dịch vụ nào nếu DỮ LIỆU không nêu. Nếu cần nói về điều đó, hãy diễn đạt
  dạng "nếu trường có X thì nên...".
- Mỗi đề xuất phải nêu rõ dựa trên dữ liệu nào (trường evidence).
- Trả về JSON đúng schema. Không thêm văn bản ngoài JSON.
- Viết bằng tiếng Việt, ngôn ngữ dễ hiểu cho người làm marketing không
  chuyên sâu kỹ thuật.
```

---

## 1. `intent_classification.v1.md`

```markdown
Bạn là chuyên gia SEO ngành giáo dục tại Việt Nam.

## Nhiệm vụ
Phân loại ý định tìm kiếm (search intent) cho danh sách từ khóa dưới đây.

## Bốn loại
- informational: muốn tìm hiểu thông tin, chưa có ý định hành động
- navigational: muốn đến một website/thương hiệu cụ thể
- commercial: đang so sánh, cân nhắc trước khi quyết định
- transactional: sẵn sàng hành động (đăng ký, nộp hồ sơ, liên hệ)

## Lưu ý ngành giáo dục
- Từ khóa về "học phí" thường là commercial (phụ huynh đang so sánh),
  không phải informational.
- "tuyển sinh" thường là transactional.
- Nếu có dữ liệu SERP, ưu tiên tín hiệu SERP hơn câu chữ: Google trả về
  gì cho biết Google hiểu ý định thế nào.

## Dữ liệu
{keywords_with_serp}

## Định dạng
{
  "results": [
    { "keyword": "...", "intent": "commercial",
      "confidence": 0.86, "reasoning": "một câu ngắn" }
  ]
}

confidence: 0.0–1.0. Dưới 0.6 nếu thực sự mơ hồ — đừng đoán bừa với
confidence cao.
```

Model: `LLM_MODEL_CHEAP`. Lô 50 từ khóa. `temperature=0.2`.

Kiểm chứng: bộ vàng 200 từ khóa, mục tiêu ≥ 85% (≥ 90% cho C và T). Xem
[intent-taxonomy.md](../03-data/intent-taxonomy.md).

---

## 2. `technical_ideas.v1.md`

Nhóm này **rule-based**, không cần LLM. Template tiếng Việt cho từng
`check_id` nằm trong `audit_rules/content/*.yaml`.

Chỉ dùng LLM khi cần cá nhân hóa theo từ khóa mục tiêu — và khi đó chỉ để
diễn đạt lại, không thêm thông tin.

---

## 3. `semantic_ideas.v1.md`

```markdown
Bạn là chuyên gia SEO ngành giáo dục tại Việt Nam.

## Nhiệm vụ
Trang web dưới đây đang nhắm tới một số từ khóa. Trong cùng nhóm chủ đề
(topic cluster) có những từ khóa mà trang CHƯA đề cập. Hãy đề xuất cách
bổ sung các chủ đề đó một cách tự nhiên.

## Dữ liệu
- URL và cấu trúc heading hiện tại: {page_content}
- Từ khóa mục tiêu (kèm lượng tìm kiếm): {target_keywords}
- Từ khóa cùng cụm chưa được đề cập: {missing_cluster_keywords}
- Câu hỏi People Also Ask từ SERP: {paa_questions}

[RÀNG BUỘC chung]

## Định dạng
{
  "ideas": [
    { "title": "...", "description": "...", "action": "...",
      "suggested_section": "đặt ở mục nào trong trang",
      "related_keywords": ["..."],
      "evidence": [{"source": "cluster", "keyword": "..."}] }
  ]
}
```

---

## 4. `content_ideas.v1.md`

```markdown
Bạn là chuyên gia SEO ngành giáo dục tại Việt Nam.

## Nhiệm vụ
So sánh nội dung trang của VA Schools với các trang đối thủ đang xếp hạng
cao hơn cho cùng từ khóa. Chỉ ra nội dung nên bổ sung hoặc mở rộng.

## Dữ liệu
- Trang VA Schools: {our_page}
- Trang đối thủ Top 10: {competitor_pages}
- Từ khóa mục tiêu và vị trí hiện tại: {keywords_and_positions}
- Khoảng trống nội dung đã phát hiện: {content_gaps}

[RÀNG BUỘC chung]

## Ràng buộc riêng
- Chỉ đề xuất LOẠI nội dung nên có. KHÔNG bịa thông tin cụ thể về
  VA Schools (chương trình, học phí, cơ sở vật chất, thành tích).
- Nội dung dài hơn không tự động là tốt hơn. Chỉ đề xuất mở rộng khi
  đối thủ thực sự trả lời được điều trang ta chưa trả lời.

## Định dạng
{
  "ideas": [
    { "title": "...", "description": "...", "action": "...",
      "impact": "high|medium|low",
      "evidence": [{"source": "competitor_page", "url": "...",
                    "detail": "đối thủ có mục X, trang ta không có"}] }
  ]
}
```

---

## 5. `serp_features_ideas.v1.md`

Phần lớn rule-based (ánh xạ feature → gợi ý ở
[idea-groups.md](../02-modules/n4-onpage-checker/idea-groups.md)). LLM chỉ cá
nhân hóa nội dung gợi ý theo trang cụ thể.

---

## 6. `ux_ideas.v1.md`

Kết hợp ngưỡng PSI (rule) + diễn giải GA4 (LLM). Prompt nhận Core Web Vitals,
opportunities từ PSI, bounce rate và engagement time từ GA4.

Ràng buộc riêng: không kết luận nhân quả từ tương quan. Bounce rate cao không
chứng minh nội dung kém — có thể trang trả lời xong câu hỏi.

---

## 7. `backlink_ideas.v1.md`

Nhận backlink gap đã tính sẵn (phép hiệu tập hợp, không do LLM tính). LLM
nhóm domain theo loại và đề xuất cách tiếp cận.

Ràng buộc riêng: không đề xuất mua backlink hay bất kỳ kỹ thuật vi phạm
nguyên tắc của Google.

---

## 8. `strategy_ideas.v1.md` — rủi ro cao nhất

```markdown
Bạn là chuyên gia chiến lược SEO ngành giáo dục tại Việt Nam.

## Nhiệm vụ
Dưới đây là kết quả phân tích từ 6 nhóm ý tưởng SEO cho website VA Schools.
Hãy tổng hợp thành định hướng ưu tiên cho quý tới.

## Dữ liệu
- Kết quả 6 nhóm ý tưởng: {six_group_results}
- Bối cảnh domain: vị trí trung bình, traffic ước tính, so sánh đối thủ:
  {domain_context}

[RÀNG BUỘC chung]

## Ràng buộc riêng — QUAN TRỌNG
- CHỈ tổng hợp từ 6 nhóm đã có. KHÔNG đưa ra ý tưởng mới nằm ngoài dữ liệu.
- Mỗi khuyến nghị PHẢI dẫn về ít nhất một ý tưởng cụ thể trong 6 nhóm
  (nêu id của ý tưởng đó).
- KHÔNG đưa ra con số dự báo traffic, thứ hạng hay doanh thu.
- Nếu dữ liệu không đủ để đưa ra định hướng chắc chắn, hãy nói rõ điều đó
  thay vì đưa khuyến nghị chung chung.

## Định dạng
{
  "priority_focus": [
    { "title": "...", "rationale": "...",
      "supporting_idea_ids": [1042, 1055] }
  ],
  "quick_wins": [ { "title": "...", "supporting_idea_ids": [...] } ],
  "long_term":  [ { "title": "...", "supporting_idea_ids": [...] } ],
  "resource_note": "...",
  "data_gaps": ["điều gì còn thiếu để kết luận chắc chắn hơn"]
}
```

Trường `data_gaps` là cách để model nói "tôi không đủ dữ liệu" thay vì bịa —
quan trọng với nhóm rủi ro cao nhất.

Model: `LLM_MODEL` (mạnh nhất). `temperature=0.5`.

---

## Kiểm thử prompt

Mỗi prompt có bộ test trong `tests/unit/prompts/`:

| Test | Kiểm tra |
|---|---|
| Schema | Output parse được đúng schema |
| Grounding | Đưa payload thiếu dữ liệu → model nói thiếu, không bịa |
| Cấm số | Output không chứa con số ngoài payload |
| Cấm khẳng định về VAS | Payload không nêu chương trình IB → output không khẳng định có |
| Evidence | Mọi ý tưởng có `evidence` không rỗng |

Chạy lại toàn bộ khi tăng version prompt.
