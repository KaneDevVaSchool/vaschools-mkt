# AI Search Readiness

Kiểm tra mức độ website sẵn sàng được các công cụ tìm kiếm AI trích dẫn.

**Phân loại**: Hybrid — phần rule-based tự Build, phần đánh giá nội dung sâu
cần LLM.

> ## Phạm vi cam kết — đọc trước
>
> Đây là **lĩnh vực mới, chưa có chuẩn ngành thống nhất**. SEMrush cũng dùng
> thuật toán độc quyền riêng cho phần này và không công bố.
>
> **Chỉ cam kết mức "kiểm tra cơ bản". Không quảng bá tương đương SEMrush.**
>
> Đây là mục **số 2** trong thứ tự cắt giảm nếu chậm tiến độ — giữ lại phần
> rule-based tối thiểu, bỏ phần LLM.

Phân biệt với **AI Search** trong N1 Domain Overview (AI Visibility, Mentions,
Cited Pages) — đó là **Phase 2, ngoài MVP hoàn toàn**. Mục này chỉ kiểm tra
kỹ thuật trang, không đo độ hiện diện trên các AI model.

## Phần rule-based (Build) — trong MVP

| Check | ID | Mức | Kiểm tra |
|---|---|---|---|
| llms.txt | `missing_llms_txt` | notice | Có file `/llms.txt` không |
| Structured data | `missing_structured_data` | warning | Có JSON-LD schema.org không |
| Structured data hợp lệ | `invalid_structured_data` | error | JSON-LD parse được không |
| Content chunking | `poor_content_chunking` | notice | Xem tiêu chí dưới |

### Tiêu chí content chunking

Mô hình AI trích xuất nội dung theo đoạn. Trang dễ trích xuất là trang có cấu
trúc rõ:

```python
def check_chunking(page: PageRecord) -> Finding | None:
    """Cảnh báo nếu nội dung khó tách thành đoạn có nghĩa."""
    # - Có heading phân đoạn (≥ 1 H2 cho mỗi ~500 từ)
    # - Đoạn văn không quá dài (< 150 từ/đoạn)
    # - Có danh sách/bảng cho nội dung liệt kê
    # - Câu trả lời trực tiếp nằm gần đầu mục, không chôn ở cuối
```

Đây là **heuristic hợp lý**, không phải chuẩn được chứng minh. Ghi rõ trên UI.

### Kiểm tra schema.org liên quan ngành giáo dục

Loại schema có giá trị cho trường học:

| Schema | Dùng cho |
|---|---|
| `EducationalOrganization` / `School` | Trang chủ, giới thiệu |
| `Course` | Trang chương trình học |
| `FAQPage` | Trang câu hỏi thường gặp |
| `BreadcrumbList` | Mọi trang |
| `LocalBusiness` | Trang liên hệ, cơ sở |

Check báo `notice` khi trang thuộc loại tương ứng nhưng thiếu schema phù hợp.

## Phần LLM (Hybrid) — cắt được nếu chậm

Đánh giá sâu hơn về khả năng trích dẫn:

| Đánh giá | Nội dung |
|---|---|
| Độ rõ ràng của câu trả lời | Trang có trả lời trực tiếp câu hỏi người dùng không |
| Tính đầy đủ thông tin | Thiếu thông tin nào mà AI thường cần trích dẫn |
| Tín hiệu E-E-A-T | Có tác giả, ngày cập nhật, nguồn tham khảo không |

Output ở trạng thái `pending_review`, nhãn `ESTIMATED`.

## Endpoint

```
GET /api/v1/audits/{id}/ai-readiness
```

```json
{
  "data": {
    "rule_based": {
      "llms_txt": { "value": false, "provenance": "OBSERVED" },
      "structured_data_coverage": { "value": 0.34, "provenance": "OBSERVED",
        "note": "34% số trang có JSON-LD hợp lệ" },
      "chunking_issues": { "value": 89, "provenance": "OBSERVED" }
    },
    "llm_assessment": { "status": "pending_review", "...": "..." },
    "disclaimer": "Kiểm tra cơ bản. Lĩnh vực chưa có chuẩn ngành thống nhất."
  }
}
```

Trường `disclaimer` bắt buộc có trong response, không chỉ trên UI — để mọi
nơi tiêu thụ API đều mang theo cảnh báo.

## Giao diện

- Banner đầu mục: "Kiểm tra cơ bản — lĩnh vực mới, chưa có chuẩn thống nhất.
  Không tương đương thuật toán độc quyền của SEMrush." Không ẩn được.
- Tách rõ hai phần: **Kiểm tra kỹ thuật** (rule-based, `OBSERVED`) và
  **Đánh giá nội dung** (LLM, `ESTIMATED` + `pending_review`).
- Không hiển thị điểm tổng cho mục này — một con số duy nhất sẽ tạo cảm giác
  chính xác mà ta không có cơ sở.

## Nghiệm thu

- [ ] 4 check rule-based hoạt động, có test
- [ ] Banner cảnh báo phạm vi không ẩn được
- [ ] `disclaimer` có trong API response
- [ ] Tách rõ phần đo được và phần đánh giá
- [ ] Không có điểm tổng cho mục này
- [ ] Phần LLM tắt được bằng cấu hình (để cắt nhanh nếu chậm tiến độ)
