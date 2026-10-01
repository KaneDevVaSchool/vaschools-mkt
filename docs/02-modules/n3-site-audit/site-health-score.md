# Site Health Score

Điểm tổng hợp 0–100 phản ánh sức khỏe kỹ thuật website.

**Nhãn `ESTIMATED`** — đây là công thức nội bộ, không phải phép đo. Điểm của
ta và điểm SEMrush **không so sánh được với nhau**.

## Công thức

```
site_health = 100 × (1 - weighted_error_rate)

weighted_error_rate =
      Σ (severity_weight × số_trang_bị_lỗi_đó)
    ─────────────────────────────────────────────
      tổng_số_trang × Σ severity_weight_áp_dụng_được
```

Trọng số:

| Mức | Trọng số |
|---|---|
| `error` | 10 |
| `warning` | 3 |
| `notice` | 1 |

Cắt về khoảng [0, 100].

## Vì sao chuẩn hóa theo số trang

Một site 100 trang có 50 lỗi và site 10.000 trang có 50 lỗi ở tình trạng rất
khác nhau. Chia cho tổng số trang khiến điểm so sánh được theo thời gian kể cả
khi site lớn dần.

## Xếp loại

| Điểm | Xếp loại | Màu |
|---|---|---|
| 90–100 | Rất tốt | xanh lá |
| 75–89 | Tốt | xanh nhạt |
| 50–74 | Cần cải thiện | vàng |
| 25–49 | Kém | cam |
| 0–24 | Nghiêm trọng | đỏ |

## Điểm theo nhóm

Ngoài điểm tổng, tính điểm riêng cho từng nhóm check
([error-catalog.md](error-catalog.md)):

```
crawlability · meta · content · images · performance · security · structured_data
```

Điểm nhóm hữu ích hơn điểm tổng khi cần biết **sửa gì trước**: điểm tổng 68
không nói được gì, nhưng "crawlability 92, performance 41" thì rõ ràng.

## Xu hướng theo thời gian

Lưu điểm mỗi lần audit → biểu đồ theo thời gian. Đây là cách chứng minh công
việc SEO kỹ thuật có tiến triển.

Khi số trang thay đổi nhiều giữa hai lần audit, ghi chú rõ — điểm có thể đổi
do site lớn lên chứ không do sửa lỗi.

## Endpoint

```
GET /api/v1/audits/{id}
```

```json
{
  "data": {
    "audit_id": 42,
    "site_health": { "value": 68, "rating": "needs_improvement",
      "provenance": "ESTIMATED",
      "note": "Điểm nội bộ theo công thức riêng. Không so sánh được với SEMrush." },
    "category_scores": {
      "crawlability": { "value": 92, "provenance": "ESTIMATED" },
      "performance":  { "value": 41, "provenance": "ESTIMATED" }
    },
    "issue_counts": { "error": 23, "warning": 145, "notice": 302 },
    "pages_crawled": 1240,
    "trend": [ { "date": "2026-08-28", "score": 61 },
               { "date": "2026-09-28", "score": 68 } ],
    "top_issues": [
      { "check_id": "image_missing_alt", "severity": "warning",
        "affected_pages": 89, "impact_on_score": 4.2 }
    ]
  }
}
```

Trường `impact_on_score` trong `top_issues` quan trọng: nó trả lời "sửa cái
này thì điểm tăng bao nhiêu", biến điểm số thành công cụ ưu tiên thay vì chỉ
một con số để nhìn.

## Giao diện

| Thành phần | Yêu cầu |
|---|---|
| Vòng tròn điểm | Lớn, màu theo xếp loại |
| Nhãn `ƯỚC TÍNH` | Ngay cạnh điểm, kèm tooltip giải thích công thức |
| Cảnh báo so sánh | "Không so sánh được với điểm SEMrush" |
| Điểm theo nhóm | Thanh ngang, sắp theo điểm thấp → cao |
| Biểu đồ xu hướng | Theo các lần audit |
| Top issues | Sắp theo `impact_on_score`, có nút "xem danh sách URL" |
| Đếm theo mức | 3 con số Error/Warning/Notice, click để lọc |

Công thức phải xem được từ UI (nút "Cách tính điểm") — điểm số không giải
thích được là điểm số không đáng tin.

## Edge case

| Tình huống | Xử lý |
|---|---|
| Crawl chưa xong | Không hiện điểm, hiện tiến độ |
| Site rất nhỏ (< 10 trang) | Hiện điểm nhưng cảnh báo ít dữ liệu |
| Crawl thất bại một phần | Tính trên số trang crawl được, ghi rõ độ phủ |
| Check chưa được chuyên gia duyệt nội dung | Vẫn tính vào điểm, nội dung hiển thị mặc định |

## Nghiệm thu

- [ ] Công thức xem được từ UI
- [ ] Có cảnh báo không so sánh được với SEMrush
- [ ] Điểm theo nhóm giúp biết sửa gì trước
- [ ] `impact_on_score` tính đúng (test với dữ liệu giả lập)
- [ ] Điểm ổn định giữa 2 lần audit nếu site không đổi
