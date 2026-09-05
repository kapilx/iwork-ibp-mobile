# Insurance Wellness Hub — Complete Project Notes

## 1. What the Product Is
- **Insurance Wellness Hub (IWH)** / **Insurance Benefits Portal (IBP)** — an enterprise digital ecosystem for corporate insurance benefits and employee wellness.
- Built for **IIRM Holdings** (insurance distribution / wellness / staffing group).
- Unifies corporate insurance management, employee benefits enrollment, wellness program delivery, and claims processing into one configurable, **multi-tenant** platform.
- Replaces fragmented single-purpose benefits systems with a single guided experience: an **"Explore → Flex → Confirm"** enrollment journey.
- Serves five personas: **Employees, HR Teams, Corporate Administrators, Insurance Partners/TPAs, Wellness Service Providers.**

## 2. Architecture
- **Nx monorepo** (v20.6.1) with npm workspaces (`packages/*`, `apps/ui/*`, `apps/services/*`), TypeScript 5.7 throughout.
- **Micro-frontend architecture** via Module Federation (`@module-federation/vite`): container host + IBP / iwork / admin remotes + shared `ui-lib`.
- **NestJS microservices backend** (~20 services) fronted by an **api-gateway** and **service-registry**.
- **Multi-tenant / whitelabel** configuration via Strapi CMS ("Company Template", "Policy Template" entities).
- **PII encryption/masking framework** and **single-session security**.

## 3. Tech Stack

### Frontend
- React 18 + Vite, Module Federation for micro-frontends.
- Material UI (MUI v6) + Emotion + styled-components.
- State/data: Redux Toolkit + react-redux, TanStack React Query.
- Forms: react-hook-form; routing: react-router-dom v6.
- Data grids: MUI X Data Grid, AG Grid.
- Charts: ECharts, Recharts.
- Animation: GSAP, Framer Motion.
- Rich text: react-quill / Jodit, react-markdown.
- Mobile: React Native app (`apps/mobile/`).

### Backend
- NestJS (v10) microservices.
- PostgreSQL with TypeORM.
- JWT + Passport auth (incl. Google OAuth20).
- Redis (ioredis) for caching.
- NestJS Schedule for cron jobs.
- Swagger / OpenAPI docs.
- Winston + winston-cloudwatch logging.

### CMS
- Strapi 5 (`strapi-cms`) for per-tenant / whitelabel content configuration.

### Cloud / Infra
- AWS SDK (SES, SNS, CloudWatch Logs).
- Docker / Kubernetes, CI/CD.
- Verdaccio local registry.
- Husky + commitlint + lint-staged.
- Testing: Jest, Vitest, Cypress (e2e apps).
- Docs tooling: MkDocs.

## 4. Frontend Micro-Frontends (`apps/ui/`)
- **container** — shell / host app.
- **ibp** — Insurance Benefits Portal, employee-facing (dashboard, My Insurance, Wellness, Claims Corner, My Documents).
- **iwork** — internal broker / ops workbench.
- **admin** — administration.
- **ui-lib** — shared component library.

## 5. Backend Microservices (~20)
- api-gateway, service-registry
- auth-service, org-service
- opportunity-service, policy-service, ibp-service
- wellness-service, notification-service, scheduler-service
- ai-service, ai-utility-service, knowledge-service
- document-service, report-service, search-service
- connector-service, config-service, master-data-service
- workflow-service, common-service
- service-lib, strapi-cms-service

## 6. Feature Modules (~70 ticketed specs)
- IBP Dashboard (PRD/TRD in `docs/implementation/ibp-service/ibp-dashboard/`)
- Policy Configurator + multi-step policy config (6+ types: GMC, GPA, GTL, Parental, Top-ups, OPD)
- Unified Enrollment (with / without policy config)
- Claims: IBP Claims Phase 1, Claims Corner, GMC claim upload
- Rewards, MIR reporting, Knowledge Central, FAQs
- Hospital Management + network map
- Instalment Notifications, Schedule Callback, Contact Matrix
- Bulk Assignment / Edit, Cut-Off Management
- Endorsements (financial / non-financial)
- My Client Portfolio, Manage Opportunities / Insurers
- User & Authorization management, API Integrations

### Implementation Docs (`docs/implementation/`)
- Claims Processing, Covers Master Management, E-Card, HR Portal
- Template Management System, Role-Permission, Activity History
- End-User Onboarding, Dynamic Cron Scheduler

## 7. Notable Integrations
- **AI:** `ai-service` + `ai-utility-service` — OpenAI SDK, Perplexity, PDF analyser, business-card extraction, AI nudges / insights, AI chatbot.
- **PDF / document extraction:** Azure AI Document Intelligence, pdf-parse, pdfjs-dist, jsPDF, puppeteer-core, LibreOffice convert; password-protected file handling (qpdf2, officecrypto-tool, archiver-zip-encrypted).
- **Search:** Azure Cognitive Search powering search-service / smart insurer search; fuzzy matching via fuzzball.
- **Policy configuration:** Policy Configurator, 6+ policy types, enrollment status / lifecycle engine.
- **Notifications:** AWS SES / SNS, SMSCountry SMS integration.
- **Excel / ETL:** exceljs + xlsx for employee/TPA data upload and Excel transformation.
- **FAQ / knowledge base:** knowledge-service + Knowledge Central + IBP FAQs.
- **Dashboards & reporting:** IBP Dashboard, MIR, report-service, ECharts/Recharts, insurer-filter dashboards.
- **Service / request tracking:** Service tracker, schedule callback, claim intimation quick actions, hospital network access.
- **Auth:** Google OAuth20, captcha libs, JWT.

## 8. Key Reference Files
- `README.md`, `docs/vision.md`, `docs/domain-glossary.md`
- `docs/implementation/ibp-service/ibp-dashboard/{prd,trd}.md` & `.../unified-enrollment/{prd,trd}.md`
- `docs/implementation/`
- `apps/services/ai-service/src`
- `apps/ui/FEATURE_FLAGS.md`
