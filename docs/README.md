# vaschools-mkt — Bộ tài liệu dự án

Nền tảng SEO/Marketing Intelligence nội bộ cho VA Schools, thay thế một phần
SEMrush theo kiến trúc **Hybrid** (mua nền dữ liệu SERP/Volume/Backlink, tự
build toàn bộ lớp xử lý, tổng hợp và hiển thị phía trên).

Stack: **Python (backend, crawler, pipeline) + React (dashboard)**.

---

## Bộ tài liệu này dùng thế nào

Docs chia **2 lớp**, đọc theo vai trò:

| Bạn là | Đọc từ | Bỏ qua |
|---|---|---|
| Ban lãnh đạo / MarHub (duyệt scope, ngân sách) | `00-overview/` | phần còn lại |
| Dev / AI coding agent (Cursor, Claude Code) | `01-architecture/` → `02-modules/` → `03-data/` | — |
| DevOps | `07-ops/` | — |

Mỗi file trong `02-modules/` là **đặc tả đủ để implement trực tiếp**: input,
output, schema, thuật toán, edge case, tiêu chí nghiệm thu. Không cần hỏi lại
tài liệu gốc.

---

## Mục lục

### 00-overview — Lớp quản lý
| File | Nội dung |
|---|---|
| [00-overview/scope.md](00-overview/scope.md) | 4 nhu cầu, cái gì trong/ngoài MVP |
| [00-overview/build-buy-hybrid.md](00-overview/build-buy-hybrid.md) | Bảng phân loại đầy đủ 4 nhu cầu + lý do |
| [00-overview/roadmap-7-weeks.md](00-overview/roadmap-7-weeks.md) | Lộ trình 7 tuần MVP, mốc nghiệm thu |
| [00-overview/cost-model.md](00-overview/cost-model.md) | Chi phí API định kỳ, so sánh SEMrush |
| [00-overview/accuracy-and-risks.md](00-overview/accuracy-and-risks.md) | Cam kết độ chính xác + rủi ro toàn dự án |
| [00-overview/glossary.md](00-overview/glossary.md) | Thuật ngữ VI/EN thống nhất |

### 01-architecture — Kiến trúc hệ thống
| File | Nội dung |
|---|---|
| [01-architecture/system-overview.md](01-architecture/system-overview.md) | Sơ đồ khối, luồng dữ liệu tổng |
| [01-architecture/tech-stack.md](01-architecture/tech-stack.md) | Python/React, thư viện, lý do chọn |
| [01-architecture/repo-structure.md](01-architecture/repo-structure.md) | Cây thư mục code, quy ước đặt tên |
| [01-architecture/pipeline-and-jobs.md](01-architecture/pipeline-and-jobs.md) | Queue, batch 100 keyword, scheduler |
| [01-architecture/api-conventions.md](01-architecture/api-conventions.md) | REST contract, phân trang, lỗi |
| [01-architecture/frontend-architecture.md](01-architecture/frontend-architecture.md) | React: routing, state, data fetching |
| [01-architecture/data-provenance.md](01-architecture/data-provenance.md) | **Bắt buộc đọc** — quy tắc gắn nhãn nguồn số liệu |

### 02-modules — Đặc tả từng nhu cầu
| Thư mục | Nhu cầu |
|---|---|
| [02-modules/n1-keyword-research/](02-modules/n1-keyword-research/) | N1 — Nghiên cứu từ khóa & Organic Research |
| [02-modules/n2-competitor-analysis/](02-modules/n2-competitor-analysis/) | N2 — Phân tích đối thủ |
| [02-modules/n3-site-audit/](02-modules/n3-site-audit/) | N3 — Site Audit (Technical SEO) |
| [02-modules/n4-onpage-checker/](02-modules/n4-onpage-checker/) | N4 — On-page Checker (7 nhóm ý tưởng) |

### 03-data — Dữ liệu
| File | Nội dung |
|---|---|
| [03-data/database-schema.md](03-data/database-schema.md) | Toàn bộ bảng PostgreSQL + index |
| [03-data/ctr-model.md](03-data/ctr-model.md) | Bảng CTR theo vị trí + hiệu chỉnh GA4 |
| [03-data/intent-taxonomy.md](03-data/intent-taxonomy.md) | Định nghĩa I/N/C/T + quy tắc gán nhãn |
| [03-data/seed-keywords.md](03-data/seed-keywords.md) | Bộ từ khóa hạt giống ngành giáo dục |

### 04-integrations — Nhà cung cấp bên ngoài
| File | Nội dung |
|---|---|
| [04-integrations/serp-api.md](04-integrations/serp-api.md) | DataForSEO/SerpAPI: chọn, quota, adapter |
| [04-integrations/keyword-planner.md](04-integrations/keyword-planner.md) | Google Ads API, điều kiện tài khoản |
| [04-integrations/pagespeed-insights.md](04-integrations/pagespeed-insights.md) | PSI API, Core Web Vitals |
| [04-integrations/backlink-provider.md](04-integrations/backlink-provider.md) | Backlink DB (Buy bắt buộc) |
| [04-integrations/ga4.md](04-integrations/ga4.md) | GA4 Data API, dùng để hiệu chỉnh |
| [04-integrations/provider-abstraction.md](04-integrations/provider-abstraction.md) | Lớp adapter chống khóa nhà cung cấp |

### 05-llm — Tầng AI
| File | Nội dung |
|---|---|
| [05-llm/llm-usage-policy.md](05-llm/llm-usage-policy.md) | Dùng LLM ở đâu, cấm ở đâu, chống hallucination |
| [05-llm/prompt-templates.md](05-llm/prompt-templates.md) | Template cho intent, cluster, 7 nhóm ý tưởng |
| [05-llm/human-review-workflow.md](05-llm/human-review-workflow.md) | Quy trình chuyên gia SEO duyệt |

### 06-delivery — Chất lượng & bàn giao
| File | Nội dung |
|---|---|
| [06-delivery/definition-of-done.md](06-delivery/definition-of-done.md) | DoD từng module |
| [06-delivery/validation-gates.md](06-delivery/validation-gates.md) | Đối chiếu chéo SEMrush, ngưỡng chấp nhận |
| [06-delivery/testing-strategy.md](06-delivery/testing-strategy.md) | Unit/integration/fixture SERP |

### 07-ops — Vận hành
| File | Nội dung |
|---|---|
| [07-ops/deployment.md](07-ops/deployment.md) | Docker, môi trường, biến cấu hình |
| [07-ops/scheduling-and-quota.md](07-ops/scheduling-and-quota.md) | Lịch crawl, trần chi phí |
| [07-ops/monitoring.md](07-ops/monitoring.md) | Log, cảnh báo, theo dõi quota |

---

## Nguyên tắc bất di bất dịch

1. **Mọi số liệu hiển thị phải mang nhãn nguồn.** `THẬT` (GA4/GSC/SERP quan sát
   trực tiếp) vs `ƯỚC TÍNH` (mô hình tự tính). Xem [data-provenance.md](01-architecture/data-provenance.md).
2. **Không thay thế GA4/GSC.** Organic Research tự build chỉ dùng cho Traffic
   Value và so sánh đối thủ, không phải nguồn báo cáo traffic chính thức.
3. **Mọi gợi ý do LLM sinh ra phải qua chuyên gia SEO duyệt** trước khi hiển thị
   cho người dùng cuối.
4. **Không khóa vào một nhà cung cấp SERP API.** Mọi lời gọi đi qua lớp adapter.
