# Chính sách sử dụng LLM

> **Rủi ro đã xác định**: "AI có thể đưa ra gợi ý sai kỹ thuật SEO
> (hallucination) — có thể xảy ra ở bất kỳ nhóm nào, không chỉ nhóm Chiến
> lược. Cần cơ chế duyệt của con người cho tất cả 7 nhóm."

## Quy tắc số 1 — LLM không sinh số liệu

**Mọi con số trong hệ thống đến từ đo đạc (adapter) hoặc tính toán (analytics).
Không bao giờ từ LLM.**

| LLM được phép | LLM bị cấm |
|---|---|
| Phân loại (intent I/N/C/T) | Ước tính search volume |
| Diễn đạt lỗi kỹ thuật thành gợi ý | Dự đoán vị trí xếp hạng |
| Sinh outline bài viết | Tính traffic, CTR, traffic value |
| So sánh nội dung, chỉ ra chủ đề thiếu | Đếm số từ, số backlink |
| Tổng hợp nhiều nhóm thành định hướng | Đưa ra con số dự báo bất kỳ |

Nếu một gợi ý cần con số, con số đó được **chèn vào prompt từ DB** và LLM chỉ
diễn đạt lại. Không bao giờ để LLM tự nghĩ ra.

Lý do: số do LLM sinh ra trông giống hệt số đo được, nhưng không tái lập được,
không truy vết được nguồn, và có thể hoàn toàn bịa. Đây là cách nhanh nhất
phá hủy toàn bộ nỗ lực về nhãn nguồn dữ liệu.

## Quy tắc số 2 — mọi output là `pending_review`

Không có ngoại lệ cho cả 7 nhóm. Xem
[human-review-workflow.md](human-review-workflow.md).

## Quy tắc số 3 — mọi output phải dẫn về dữ liệu nguồn

Mỗi gợi ý mang trường `evidence` trỏ về finding, keyword hoặc SERP result cụ
thể. Gợi ý không chứng minh được là gợi ý không duyệt được.

## Nơi dùng LLM

| Nơi | Module | Rủi ro | Giảm thiểu |
|---|---|---|---|
| Phân loại intent | N1 | Thấp | Bộ vàng 200 từ khóa, đo độ chính xác |
| Outline Strategy Builder | N1 | Trung bình | Duyệt trước khi dùng |
| So sánh content gap | N2 | Trung bình | Chỉ so nội dung đã crawl, không bịa |
| AI Search readiness (phần sâu) | N3 | Trung bình | Phạm vi hạn chế, tắt được |
| 6 nhóm ý tưởng | N4 | Trung bình–Cao | Duyệt từng nhóm |
| **Strategy Ideas** | N4 | **Cao nhất** | Duyệt từng cái, mặc định thu gọn |

## Chống hallucination

| Kỹ thuật | Cách làm |
|---|---|
| **Grounding bắt buộc** | Prompt nêu rõ: chỉ dùng dữ liệu trong payload, không suy diễn ngoài |
| **JSON schema cố định** | Output phải parse được; sai schema → retry 1 lần → bỏ |
| **Cấm thông tin về VAS** | Prompt cấm khẳng định điều gì về trường mà payload không nêu |
| **Yêu cầu trích dẫn** | Mỗi gợi ý phải nêu dựa trên dữ liệu nào |
| **Nhiệt độ thấp** | `temperature=0.2` cho phân loại, `0.5` cho sinh nội dung |
| **Payload gọn** | Nhồi dữ liệu không làm tốt hơn, chỉ gây nhiễu |

Kỹ thuật thứ ba đáng nhấn mạnh: LLM rất dễ viết "VA Schools nên nhấn mạnh
chương trình IB của mình" khi trường có thể không có chương trình IB. Prompt
phải cấm rõ ràng, và lý do từ chối `sai_thông_tin_vas` dùng để theo dõi tỷ lệ
này.

## Kiểm soát chi phí

| Cơ chế | Chi tiết |
|---|---|
| Cache theo `payload_hash` | Payload không đổi → không gọi lại. Cơ chế chính |
| Gom lô | Intent: 50 từ khóa/request |
| Giới hạn URL/ngày | Cấu hình `LLM_MAX_URLS_PER_DAY` |
| Tóm tắt thay vì toàn văn | `content_summary`, không gửi HTML |
| Đếm token mỗi lời gọi | Ghi vào `job_runs.estimated_cost_usd` |

## Model

Dùng model mới nhất của Claude. Cấu hình qua env, không hardcode:

```
ANTHROPIC_API_KEY=
LLM_MODEL=claude-opus-5
LLM_MODEL_CHEAP=claude-haiku-4-5-20251001   # phân loại intent theo lô
LLM_MAX_URLS_PER_DAY=100
```

Phân loại intent là tác vụ đơn giản, chạy trên hàng nghìn từ khóa — dùng model
nhẹ. Strategy Ideas là tác vụ tổng hợp khó — dùng model mạnh nhất.

## Versioning prompt

Mọi prompt lưu file có version: `prompts/strategy_ideas.v2.md`.

Mỗi output lưu `prompt_version`. Điều này cho phép:

- So sánh tỷ lệ từ chối giữa các version.
- Biết gợi ý cũ sinh bằng prompt nào khi rà soát.
- Rollback nếu version mới tệ hơn.

Đổi prompt → chạy lại bộ test tương ứng (bộ vàng intent, test case cho từng
nhóm ý tưởng).

## Nghiệm thu

- [ ] Không có con số nào trong DB có nguồn gốc từ LLM (rà soát code)
- [ ] Mọi output LLM mặc định `pending_review`
- [ ] Mọi output có `evidence`
- [ ] Cache theo `payload_hash` hoạt động
- [ ] `prompt_version` lưu cùng mỗi output
- [ ] Chi phí LLM ghi vào `job_runs`
- [ ] Prompt cấm rõ việc khẳng định thông tin về VAS
