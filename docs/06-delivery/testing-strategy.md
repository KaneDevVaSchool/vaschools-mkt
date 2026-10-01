# Chiến lược kiểm thử

## Nguyên tắc

**Không test nào được gọi API ngoài.** Mọi provider trong test dùng `fake`
implementation đọc từ fixture. Test gọi mạng là test không tái lập được, chậm,
và đốt quota.

## Kim tự tháp

```
        ┌─────────────┐
        │   E2E (ít)  │   luồng chính, chạy tay trước phát hành
        ├─────────────┤
        │ Integration │   job + DB + fake provider
        ├─────────────┤
        │    Unit     │   ← phần lớn: analytics là hàm thuần
        └─────────────┘
```

Tầng `analytics/` là hàm thuần và chiếm phần lớn giá trị nghiệp vụ — đây là
lý do kiến trúc cấm nó import `providers`/`db`. Hệ quả: test được đầy đủ mà
không cần hạ tầng.

## Unit test — `analytics/`

| Module | Test quan trọng |
|---|---|
| `match_type.py` | `exact ⊆ phrase ⊆ broad`; `related ∩ broad = ∅` |
| `ctr_model.py` | `position=None` → 0; nội suy đúng; version load đúng |
| `traffic_estimator.py` | **Cùng hàm cho VAS và đối thủ**; volume `null` bị bỏ qua |
| `competitor_detector.py` | Domain blocklist bị lọc; ngưỡng hoạt động |
| `branded.py` | "vas" không khớp trong "vasco"; khớp cả có/không dấu |
| `rank_history.py` | 5 trạng thái improved/declined/new/lost/not_ranking |
| `audit_rules/*` | Mỗi check có fixture HTML dương tính và âm tính |
| `provenance.py` | `combine()` trả nhãn thấp nhất |

Test đáng viết nhất: `traffic_estimator` dùng cùng code path cho VAS và đối
thủ. Đây là điều cả N1 và N2 phụ thuộc và rất dễ vô tình phá vỡ khi tối ưu.

## Fixture

```
tests/fixtures/
├── serp/            response thật đã ghi lại
│   ├── normal.json
│   ├── with_features.json      featured snippet, PAA, local pack
│   ├── empty.json
│   ├── rate_limited.json       429
│   └── schema_changed.json     ⚠ provider đổi format
├── keyword_planner/
├── psi/                        field data + lab data
├── ga4/
├── html/                       cho audit_rules
│   ├── missing_h1.html
│   ├── js_rendered.html
│   └── ...
└── intent_golden_set.json      200 từ khóa, bộ vàng
```

Fixture ghi từ response thật, không viết tay — response thật có những chi tiết
mà ta không nghĩ ra.

`schema_changed.json` đáng có riêng: test rằng adapter raise
`ProviderSchemaError` thay vì ghi dữ liệu méo vào raw store.

## Integration test

| Test | Kiểm tra |
|---|---|
| `fetch_serp_batch` idempotent | Chạy 2 lần cùng input → 1 bản ghi |
| Quota guard | Đạt trần → job dừng, không gọi provider |
| Cache theo tier | Snapshot tươi → không gọi provider |
| Lỗi một phần | 100 keyword, 3 lỗi → ghi 97, đánh dấu 3 |
| Provider contract | Mọi implementation thỏa cùng ràng buộc |
| Migration | `alembic upgrade head` từ DB rỗng chạy sạch |

## Test prompt LLM

Không test output cụ thể (không tất định). Test **ràng buộc**:

| Test | Kiểm tra |
|---|---|
| Schema | Output parse được |
| Grounding | Payload thiếu dữ liệu → model nói thiếu, không bịa |
| Cấm số | Output không chứa số ngoài payload |
| Cấm khẳng định về VAS | Payload không nêu IB → output không khẳng định có |
| Evidence | Mọi ý tưởng có `evidence` không rỗng |

Chạy với model thật nhưng đánh dấu `@pytest.mark.llm` — không chạy trong CI
mặc định, chạy khi đổi prompt version.

Bộ vàng intent chạy như một test bình thường, có ngưỡng đạt/không đạt.

## Frontend

| Loại | Công cụ | Trọng tâm |
|---|---|---|
| Component | Vitest + Testing Library | `MetricCell` render đúng 4 nhãn; `value: null` → `—` |
| Hook | Vitest + MSW | Xử lý 4 trạng thái |
| Lint rule tự viết | ESLint | Chặn truy cập `.value` ngoài `MetricCell` |

Lint rule đó là cách thực thi quy tắc nhãn nguồn ở frontend — hiệu quả hơn
nhắc nhở trong code review.

## CI

```
1. ruff check + ruff format --check
2. pytest tests/unit          (nhanh, chạy mọi commit)
3. pytest tests/integration   (cần Postgres + Redis service)
4. eslint + tsc --noEmit
5. vitest run
```

Test có `@pytest.mark.llm` loại khỏi CI mặc định.

## Độ phủ mục tiêu

| Tầng | Mục tiêu |
|---|---|
| `analytics/` | **≥ 90%** — nơi chứa logic nghiệp vụ |
| `providers/` | ≥ 70% |
| `api/` | ≥ 60% |
| `crawler/` | ≥ 70% |

Độ phủ không phải mục tiêu tự thân, nhưng `analytics/` thấp hơn 90% là dấu
hiệu có logic nghiệp vụ nằm sai chỗ.
