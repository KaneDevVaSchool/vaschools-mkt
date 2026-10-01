# Kiến trúc Frontend

React 18 + TypeScript + Vite. SPA độc lập, chỉ giao tiếp với backend qua REST.

## Tổ chức theo feature

```
src/
├── api/
│   ├── client.ts          fetch wrapper: base URL, API key, xử lý lỗi
│   ├── types.ts           ⚠ sinh từ OpenAPI schema, KHÔNG viết tay
│   └── hooks/             một file một nhóm endpoint
│       ├── useKeywords.ts
│       ├── useCompetitors.ts
│       ├── useAudit.ts
│       └── useOnpage.ts
├── components/
│   ├── ui/                Button, Table, Badge, Tooltip, Modal…
│   ├── ProvenanceBadge/   ⚠ BẮT BUỘC ở mọi chỗ hiển thị số liệu
│   ├── MetricCell/        số + badge + tooltip, dùng trong bảng
│   └── DataFreshness/     hiển thị meta.data_fetched_at
├── features/
│   ├── keywords/          N1
│   ├── competitors/       N2
│   ├── audit/             N3
│   └── onpage/            N4
├── routes/
└── styles/tokens.css      CSS variables
```

Mỗi thư mục trong `features/` tự chứa `components/`, `pages/`, `utils/`.
Component dùng chung giữa nhiều feature mới được đưa lên `components/ui/`.

## State

| Loại state | Công cụ | Ví dụ |
|---|---|---|
| Server state | **TanStack Query** | Danh sách từ khóa, kết quả audit |
| URL state | **React Router** search params | Bộ lọc, trang, sort |
| UI state cục bộ | `useState` | Modal mở/đóng, tab đang chọn |
| State toàn cục | **không có** | Nếu thấy cần, khả năng cao là server state đặt sai chỗ |

Bộ lọc phải nằm trong URL, không trong `useState` — người dùng cần chia sẻ
được link tới một bảng đã lọc khi trao đổi với đồng nghiệp.

## Quy tắc hiển thị số liệu — bắt buộc

Mọi số liệu từ API đi qua `<MetricCell>`:

```tsx
<MetricCell metric={row.traffic_value} format="currency" />
```

`MetricCell` tự động:
- Hiển thị `—` khi `value === null`, kèm tooltip là `note`.
- Gắn `<ProvenanceBadge provenance={...} />`.
- Với `ESTIMATED`: tooltip giải thích công thức.

**Không được render số trực tiếp** (`{row.traffic_value.value}`). ESLint rule
tự viết chặn việc truy cập `.value` ngoài `MetricCell`.

Mỗi trang có `<DataFreshness>` ở đầu, đọc từ `meta.data_fetched_at`.

## Xử lý bốn trạng thái

Mọi màn hình dữ liệu phải xử lý đủ:

| Trạng thái | Hiển thị |
|---|---|
| Loading | Skeleton theo đúng hình dạng bảng, không spinner giữa màn hình |
| Empty (`NO_DATA_YET`) | "Chưa có dữ liệu. Chạy job thu thập?" + nút gọi admin endpoint |
| Error | Message tiếng Việt từ `error.message` + nút thử lại |
| Stale (`is_stale`) | Banner "Dữ liệu cập nhật lần cuối {ngày}" |

Trạng thái empty quan trọng hơn bình thường: trong nhiều tuần đầu, phần lớn
màn hình sẽ rỗng vì job chưa chạy.

## Job chạy nền

Endpoint ghi trả `202` + `job_id`. Frontend:

1. Hiện trạng thái "Đang xử lý…" ngay.
2. Poll `/admin/jobs/{job_id}` mỗi 3 giây (TanStack Query `refetchInterval`).
3. Xong → invalidate query liên quan, tự refetch.

Không chặn UI. Người dùng chuyển màn hình khác được, job vẫn chạy.

## Bảng dữ liệu

TanStack Table v8. Yêu cầu cho Keyword Overview (tối đa 100 dòng):

- Sort theo mọi cột số.
- Lọc theo intent, match type, khoảng volume.
- Chọn cột hiển thị (nhiều chỉ số cùng lúc dễ gây rối mắt — đây là khó khăn
  đã nêu trong tài liệu gốc, tuần 4).
- Export CSV **kèm cột nhãn nguồn và chân trang cảnh báo**
  ([data-provenance.md](data-provenance.md)).
- Ảo hóa dòng (virtualization) khi > 200 dòng.

Mặc định hiển thị 5 cột: từ khóa, volume, intent, vị trí, traffic value. Các
cột khác ẩn sau nút "Cột".

## Design token

`styles/tokens.css`, CSS variables. Màu nhãn nguồn cố định toàn app:

```css
--prov-measured:  /* xanh lá  */
--prov-observed:  /* xanh dương */
--prov-vendor:    /* xám */
--prov-estimated: /* vàng */
```

Mức nghiêm trọng Site Audit dùng bộ token riêng (`--sev-error`,
`--sev-warning`, `--sev-notice`), không tái dùng màu nhãn nguồn — hai khái
niệm khác nhau, dùng chung màu sẽ gây nhầm.

## Responsive

Hoạt động ở 3 breakpoint: mobile (≤480px), tablet (≤768px), desktop (≥1280px).
Bảng nhiều cột trên mobile chuyển sang dạng thẻ (card), không scroll ngang.
