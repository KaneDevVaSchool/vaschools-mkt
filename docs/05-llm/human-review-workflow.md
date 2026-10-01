# Quy trình duyệt của con người

Quy trình cấp dự án. Chi tiết UI và trạng thái của N4 ở
[review-mechanism.md](../02-modules/n4-onpage-checker/review-mechanism.md).

## Phạm vi — cái gì cần duyệt

| Nội dung | Ai duyệt | Khi nào | Mức |
|---|---|---|---|
| Nội dung giải thích lỗi Site Audit | Chuyên gia SEO | Một lần/check, trước phát hành | **Bắt buộc** |
| Danh sách đối thủ tự động | Marketing | Mỗi lần phát hiện domain mới | **Bắt buộc** |
| Intent do LLM gán | Chuyên gia SEO | Mẫu ngẫu nhiên + `confidence < 0,6` | Lấy mẫu |
| Outline Strategy Builder | Chuyên gia SEO | Mỗi lần sinh | **Bắt buộc** |
| Content gap report | Chuyên gia SEO | Mỗi lần sinh | **Bắt buộc** |
| 6 nhóm ý tưởng N4 | Chuyên gia SEO | Theo lô | **Bắt buộc** |
| **Strategy Ideas** | Chuyên gia SEO **+ Marketing** | Từng cái | **Bắt buộc, 2 người** |

Chỉ có intent là duyệt theo mẫu — vì đo được độ chính xác bằng bộ vàng, và
sai một nhãn intent không gây hậu quả nghiêm trọng.

## Vì sao không tự động hóa hoàn toàn

Ba lý do, theo thứ tự nghiêm trọng:

1. **Gợi ý sai kỹ thuật SEO** có thể khiến đội thực thi làm hỏng thứ đang
   hoạt động tốt.
2. **Bịa thông tin về VA Schools** — nếu lọt vào nội dung công bố, đây là rủi
   ro thương hiệu, không chỉ rủi ro SEO.
3. **Gợi ý chiến lược sai hướng** làm lãng phí cả quý nguồn lực.

Chi phí của bước duyệt thấp hơn nhiều so với chi phí của một trong ba điều
trên.

## Nguyên tắc thiết kế quy trình duyệt

| Nguyên tắc | Lý do |
|---|---|
| **Duyệt phải nhanh** | Phím tắt, duyệt hàng loạt. Quy trình chậm sẽ bị bỏ qua |
| **Duyệt template, không duyệt từng instance** khi có thể | Technical Ideas sinh từ template cố định — duyệt một lần |
| **Luôn xem được dữ liệu nguồn** | Không ai duyệt được thứ họ không kiểm chứng được |
| **Từ chối phải có lý do có cấu trúc** | Lý do là dữ liệu cải thiện prompt |
| **Chưa duyệt vẫn xem được** (trừ Strategy) | Ẩn hoàn toàn biến duyệt thành nút thắt |
| **Ghi lại ai duyệt, khi nào, prompt version nào** | Truy vết và so sánh chất lượng |

## Vai trò

| Vai trò | Quyền | Người |
|---|---|---|
| Viewer | Xem nội dung đã duyệt + chưa duyệt (có banner) | Đội Marketing |
| SEO Reviewer | Duyệt/từ chối/sửa mọi nhóm trừ Strategy | Chuyên gia SEO |
| Strategy Approver | Duyệt Strategy Ideas | Chuyên gia SEO + trưởng nhóm Marketing |
| Admin | Chạy job, xem quota, sửa cấu hình | Đội kỹ thuật |

## Ước lượng khối lượng công việc

Cần nêu rõ với Marketing từ đầu — đây là cam kết thời gian thật:

| Việc | Tần suất | Ước tính |
|---|---|---|
| Duyệt nội dung 44 check Site Audit | Một lần, tuần 4–5 | ~4–6 giờ |
| Duyệt danh sách đối thủ ban đầu | Một lần, tuần 3 | ~1 giờ |
| Duyệt ý tưởng N4 đợt đầu | Tuần 6–7 | ~4–8 giờ |
| Duyệt định kỳ sau ra mắt | Hàng tuần | ~1–2 giờ |

Nếu không có người cam kết thời gian này, N3 và N4 không phát hành được đầy
đủ. Đây là điều kiện tiên quyết ghi trong
[scope.md](../00-overview/scope.md).

## Vòng phản hồi

```
Gợi ý sinh ra  →  duyệt / từ chối (kèm lý do)
                          │
                          ▼
              thống kê theo nhóm và lý do
                          │
                          ▼
      tỷ lệ từ chối > 40%  →  sửa prompt, tăng version
                          │
                          ▼
              chạy lại test → so sánh tỷ lệ
```

Chỉ số đáng theo dõi nhất: tỷ lệ từ chối vì `sai_thông_tin_vas`. Đây là đo
lường trực tiếp mức hallucination nguy hiểm nhất. Mục tiêu: **< 5%**.

## Nghiệm thu

- [ ] Mọi loại nội dung trong bảng phạm vi có đường duyệt rõ ràng
- [ ] Duyệt hàng loạt + phím tắt hoạt động
- [ ] Xem được dữ liệu nguồn từ màn hình duyệt
- [ ] Lý do từ chối có cấu trúc, thống kê được
- [ ] Phân quyền theo 4 vai trò
- [ ] Thống kê tỷ lệ từ chối theo nhóm và prompt version
