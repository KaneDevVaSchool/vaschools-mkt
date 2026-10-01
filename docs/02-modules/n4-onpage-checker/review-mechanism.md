# Cơ chế duyệt của con người

Bước 5 trong kiến trúc 6 bước. **Áp dụng cho cả 7 nhóm, không chỉ Strategy** —
hallucination có thể xảy ra ở bất kỳ nhóm nào.

## Vòng đời một ý tưởng

```
     LLM/rule sinh
          │
          ▼
   ┌──────────────┐
   │pending_review│  ← mặc định, hiển thị kèm banner cảnh báo
   └──────┬───────┘
          │ chuyên gia SEO xem xét
    ┌─────┼─────┬──────────┐
    ▼     ▼     ▼          ▼
approved rejected  edited  needs_data
    │      │        │          │
    │      │        └─► approved sau khi sửa
    │      │
    │      └─► ẩn khỏi danh sách chính, giữ để phân tích chất lượng
    │
    └─► hiển thị như khuyến nghị chính thức
```

Trạng thái `needs_data`: gợi ý có vẻ đúng nhưng không đủ dữ liệu để kết luận —
đánh dấu để xem lại sau khi module nền đầy đủ hơn.

## Ai duyệt cái gì

| Nhóm | Người duyệt | Mức bắt buộc |
|---|---|---|
| Technical | Dev/SEO | Duyệt một lần cho mỗi **template**, không từng ý tưởng |
| UX, Semantic, SERP Features | Chuyên gia SEO | Theo lô |
| Content, Backlink | Chuyên gia SEO | Theo lô |
| **Strategy** | **Chuyên gia SEO + Marketing** | **Từng ý tưởng, bắt buộc** |

Technical Ideas là rule-based, sinh từ template cố định — duyệt template một
lần là đủ, không bắt duyệt lại mỗi lần chạy. Đây là lý do nhóm này ra mắt
được sớm nhất.

Strategy Ideas ngược lại: mỗi lần sinh ra nội dung khác nhau, phải duyệt từng
cái.

## Hiển thị theo trạng thái

| Trạng thái | Hiển thị |
|---|---|
| `pending_review` | Banner vàng "Gợi ý AI — chưa qua chuyên gia duyệt". Mặc định thu gọn với nhóm Strategy |
| `approved` | Hiển thị bình thường, có dấu "Đã duyệt" + tên người duyệt + ngày |
| `edited` | Như approved, thêm "Đã chỉnh sửa bởi chuyên gia" |
| `rejected` | Ẩn khỏi danh sách chính, xem được ở tab riêng |
| `needs_data` | Tab riêng, kèm ghi chú thiếu dữ liệu gì |

Người dùng cuối (Marketing) **có thể** xem gợi ý chưa duyệt — nhưng phải thấy
rõ banner. Ẩn hoàn toàn sẽ khiến quy trình duyệt thành nút thắt cổ chai.

Ngoại lệ: nhóm Strategy mặc định thu gọn cho tới khi duyệt, vì đây là nhóm dễ
gây hành động sai nhất.

## Giao diện duyệt

Màn hình riêng cho chuyên gia SEO:

| Thành phần | Yêu cầu |
|---|---|
| Hàng đợi duyệt | Sắp theo nhóm, mới nhất trước |
| Xem dữ liệu nguồn | Hiện `evidence` — dẫn thẳng tới finding/keyword/SERP gốc |
| Duyệt hàng loạt | Chọn nhiều, duyệt/từ chối cùng lúc |
| Sửa nội dung | Sửa trực tiếp `title`/`description`/`action` rồi duyệt |
| Lý do từ chối | Chọn từ danh sách + ghi chú tự do |
| Phím tắt | A = duyệt, R = từ chối, E = sửa — người duyệt hàng trăm mục cần tốc độ |

Nút "xem dữ liệu nguồn" là quan trọng nhất: chuyên gia không thể duyệt cái
họ không kiểm chứng được.

## Lý do từ chối — thu thập có cấu trúc

Danh sách cố định để phân tích được chất lượng theo thời gian:

```
sai_kỹ_thuật_seo      — gợi ý sai về mặt SEO
sai_thông_tin_vas     — bịa thông tin về trường
không_khả_thi         — đúng nhưng không làm được
trùng_lặp             — đã có gợi ý tương tự
không_liên_quan       — không áp dụng cho trang này
đã_làm_rồi            — trang đã có thứ này
dữ_liệu_nền_sai       — vấn đề ở module nền, không phải LLM
```

## Vòng phản hồi cải thiện chất lượng

Tỷ lệ từ chối theo nhóm và theo lý do là **thước đo chất lượng prompt**:

```
GET /api/v1/admin/review-stats
```

| Chỉ số | Dùng để |
|---|---|
| Tỷ lệ từ chối theo nhóm | Nhóm nào prompt cần sửa |
| Lý do từ chối phổ biến nhất | Sửa gì trong prompt |
| Tỷ lệ `sai_thông_tin_vas` | Đo mức hallucination — nghiêm trọng nhất |
| Tỷ lệ `dữ_liệu_nền_sai` | Vấn đề không nằm ở N4 |

Ngưỡng cảnh báo: nếu một nhóm có tỷ lệ từ chối > 40%, prompt của nhóm đó cần
sửa trước khi mở rộng sử dụng. Ghi lại version prompt cùng mỗi ý tưởng để so
sánh được giữa các version.

## Endpoint

```
GET  /api/v1/onpage/{id}?status=pending_review
POST /api/v1/onpage/ideas/{idea_id}/review
     body: { "status": "approved|rejected|edited|needs_data",
             "reason": "sai_kỹ_thuật_seo",
             "note": "...",
             "edited_content": { "action": "..." } }
POST /api/v1/onpage/ideas/bulk-review
GET  /api/v1/admin/review-stats?group=strategy&period=30d
```

Mọi hành động duyệt ghi lại: ai, khi nào, prompt version nào.

## Nghiệm thu

- [ ] Mọi ý tưởng mặc định `pending_review`
- [ ] Nhóm Strategy mặc định thu gọn cho tới khi duyệt
- [ ] Xem được dữ liệu nguồn của từng gợi ý
- [ ] Duyệt hàng loạt + phím tắt hoạt động
- [ ] Lý do từ chối có cấu trúc, thống kê được
- [ ] Prompt version lưu cùng mỗi ý tưởng
- [ ] Technical Ideas duyệt theo template, không từng cái
