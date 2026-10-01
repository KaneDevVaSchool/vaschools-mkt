# Phân loại Intent (I/N/C/T)

**Phân loại: Hybrid** — LLM gán nhãn, ta tự thiết kế prompt, lưu trữ và kiểm
chứng độ chính xác. Nhãn `ESTIMATED`.

## Bốn loại

| Mã | Tên | Người dùng muốn gì | Ví dụ ngành giáo dục |
|---|---|---|---|
| **I** | Informational | Tìm hiểu thông tin | "chương trình ib là gì", "học song ngữ có tốt không" |
| **N** | Navigational | Đến một website cụ thể | "vas tuyển sinh", "trường việt úc website" |
| **C** | Commercial | So sánh trước khi quyết định | "trường quốc tế tốt nhất tphcm", "so sánh học phí trường quốc tế" |
| **T** | Transactional | Hành động ngay | "đăng ký tuyển sinh lớp 1", "nộp hồ sơ trường quốc tế" |

## Vì sao quan trọng với VA Schools

Intent quyết định loại nội dung cần làm và giá trị của từ khóa:

| Intent | Nội dung phù hợp | Giá trị tuyển sinh |
|---|---|---|
| I | Bài blog, hướng dẫn, giải thích | Thấp — xây nhận diện |
| N | Trang chủ, trang thương hiệu | Cao nhưng đã có sẵn |
| C | Trang so sánh, đánh giá, bảng học phí | **Cao nhất** — phụ huynh đang cân nhắc |
| T | Form đăng ký, trang tuyển sinh | Cao — gần chuyển đổi |

Nhóm C là nhóm đáng đầu tư nhất trong ngành giáo dục: phụ huynh so sánh nhiều
trường trước khi quyết định, và quyết định có giá trị lớn.

## Quy tắc gán nhãn

### Tín hiệu từ vựng (kiểm tra trước, rẻ hơn LLM)

| Intent | Từ khóa chỉ báo |
|---|---|
| I | `là gì`, `tại sao`, `như thế nào`, `cách`, `hướng dẫn`, `có nên`, `khác nhau` |
| N | tên thương hiệu, `website`, `trang chủ`, `đăng nhập`, `cổng thông tin` |
| C | `tốt nhất`, `top`, `so sánh`, `đánh giá`, `review`, `nên chọn`, `bảng xếp hạng`, `học phí` |
| T | `đăng ký`, `nộp hồ sơ`, `tuyển sinh`, `liên hệ`, `hotline`, `địa chỉ` |

Trùng lặp tồn tại: "học phí trường quốc tế" vừa có thể là I (muốn biết) vừa C
(đang so sánh). Trong ngành giáo dục, **ưu tiên C** — người tìm học phí gần
như luôn đang cân nhắc.

### Tín hiệu từ SERP (mạnh hơn từ vựng)

Kết quả Google trả về cho biết Google hiểu intent thế nào:

| Tín hiệu SERP | Gợi ý intent |
|---|---|
| Nhiều bài blog, Wikipedia | I |
| Trang chủ một thương hiệu ở vị trí 1 | N |
| Trang so sánh, danh sách "top N" | C |
| Form đăng ký, trang liên hệ, Local Pack | T |
| Có ads nhiều | C hoặc T |

Đưa Top 5 SERP vào payload LLM giúp chính xác hơn đáng kể so với chỉ nhìn câu
chữ.

## Quy trình

```
1. Kiểm tra cache — từ khóa đã phân loại thì bỏ qua
2. Gom lô 50 từ khóa
3. Payload: từ khóa + Top 5 SERP (title + domain) nếu có
4. Gọi LLM, yêu cầu JSON schema cố định
5. Validate schema; sai → retry 1 lần
6. Lưu intent + confidence
7. confidence < 0,6 → đánh dấu để rà soát thủ công
```

Prompt cụ thể: [prompt-templates.md](../05-llm/prompt-templates.md).

## Output schema

```json
{
  "results": [
    { "keyword": "học phí trường quốc tế tphcm",
      "intent": "commercial",
      "confidence": 0.86,
      "reasoning": "Người dùng đang so sánh chi phí giữa các trường" }
  ]
}
```

`reasoning` ngắn gọn — dùng để chuyên gia kiểm chứng khi rà soát, không hiển
thị mặc định trên UI.

## Kiểm chứng độ chính xác

Bắt buộc, vì đây là Hybrid và ta chịu trách nhiệm về chất lượng:

```
1. Chuyên gia SEO gán nhãn thủ công 200 từ khóa mẫu (bộ vàng)
2. Chạy LLM trên cùng bộ đó
3. Tính độ chính xác tổng thể và confusion matrix
4. Mục tiêu: ≥ 85% tổng thể; ≥ 90% cho nhóm C và T
```

Nhóm C và T yêu cầu cao hơn vì chúng quyết định ưu tiên đầu tư nội dung.

Confusion matrix cho biết nhầm lẫn ở đâu — nhầm I↔C là phổ biến và ít nghiêm
trọng; nhầm C↔T ít gặp hơn nhưng ảnh hưởng lớn hơn.

Bộ vàng lưu trong `tests/fixtures/intent_golden_set.json`, chạy lại mỗi khi
đổi prompt.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Từ khóa mơ hồ ("trường quốc tế") | Chọn intent có xác suất cao nhất, `confidence` thấp, đánh dấu rà soát |
| Từ khóa tiếng Anh | Vẫn phân loại — nhiều phụ huynh tìm bằng tiếng Anh |
| Từ khóa chứa tên đối thủ | Thường là N hoặc C; nếu là C thì đây là cơ hội cạnh tranh |
| Chưa có SERP snapshot | Phân loại bằng từ vựng, `confidence` thấp hơn, phân loại lại khi có SERP |
| LLM trả intent ngoài 4 loại | Lỗi schema, retry; vẫn sai → để `null` |

## Nghiệm thu

- [ ] Bộ vàng 200 từ khóa, độ chính xác ≥ 85%
- [ ] Nhóm C và T đạt ≥ 90%
- [ ] Dùng tín hiệu SERP khi có
- [ ] Cache theo `normalized_text` — không phân loại lại
- [ ] `confidence < 0,6` được đánh dấu rà soát
- [ ] Chạy lại bộ vàng khi đổi prompt version
