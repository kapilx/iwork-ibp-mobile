# TRD — Offers & Benefits (Company Configuration)

| | |
|---|---|
| **Feature** | Offers & Benefits |
| **Status** | Draft |
| **Layers** | DB (TypeORM entity + migration) · Domain/API (`config-service`) · UI (`apps/ui/iwork`) |
| **Related docs** | [Offers-And-Benefits-PRD.md](./Offers-And-Benefits-PRD.md) |

---

## 1. Architecture overview

Follows the existing Portal Configuration layering exactly:

```
UI (OffersAndBenefitsSection) --HTTP--> CompanyConfigController
                                             |
                                       CompanyConfigService
                                             |
                                       CompanyConfigRepository (TypeORM Repository<OfferBenefit>)
                                             |
                                        PostgreSQL (new table: company_offer_benefit)
```

No new microservice — this is added to the existing `apps/services/config-service/src/app/company-config/` module, the same module that already owns `CompanyAuthenticationMapping`, `CompanyPortalConfigScope`, etc. Image storage reuses the existing S3-backed file-upload pipeline in `org-service` (`FileUpload` entity, `file_uploads` table) — no new upload infrastructure.

## 2. Data model

### 2.1 Entity: `OfferBenefit`

New file: `apps/services/service-lib/src/lib/entities/offer-benefit.entity.ts`

Modeled directly on `CompanyAuthenticationMapping` (`company-authentication-mapping.entity.ts`), which already implements the "company-level default, nullable `configId` = domain-level override" pattern this feature needs — reused rather than reinvented.

```ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { FileUpload } from './file-upload.entity';

@Entity('company_offer_benefit')
export class OfferBenefit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  /** NULL = company-level (all domains); set = override scoped to one portal config/domain */
  @Column({ name: 'config_id', type: 'int', nullable: true })
  configId: number | null;

  @Column({ name: 'title', type: 'varchar', length: 100 })
  title: string;

  @Column({ name: 'description', type: 'varchar', length: 500 })
  description: string;

  @Column({ name: 'redirection_url', type: 'text' })
  redirectionUrl: string;

  @Column({ name: 'image_file_id', type: 'int', nullable: true })
  imageFileId: number | null;

  @ManyToOne(() => FileUpload, { eager: true, nullable: true })
  @JoinColumn({ name: 'image_file_id' })
  imageFile: FileUpload | null;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'display_order', default: 1 })
  displayOrder: number;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'integer', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

`companyId` references the company in `org-service` (cross-service reference by convention — same as `CompanyAuthenticationMapping.companyId`, no FK constraint across services). `configId`, when set, references `company_portal_configuration(id)` (same table `company_authentication_map.config_id` points to).

### 2.2 Migration

New file: `database-migrations/sql/company-offer-benefit.sql` (raw-SQL convention already used for additive schema changes in this repo, e.g. `company-authentication-map-domain-scope.sql`):

```sql
-- Offers & Benefits: company-level items with optional domain-level override
CREATE TABLE IF NOT EXISTS company_offer_benefit (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  config_id INTEGER REFERENCES company_portal_configuration(id),
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  redirection_url TEXT NOT NULL,
  image_file_id INTEGER REFERENCES file_uploads(id),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_by INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offer_benefit_company
  ON company_offer_benefit (company_id, config_id);
```

Register `OfferBenefit` in `company-config.module.ts`'s `TypeOrmModule.forFeature([...])` array alongside the existing entities.

### 2.3 Image / document type

Reuse `useFileUpload` + the existing `file-upload` endpoints as-is. Add a new `LookUp` row for `documentTypeLid` (mirrors `LOGO_DOCUMENT_TYPE = 'company_logo'` in `BrandingSection`): key `offer_benefit_image`. No schema change needed on `file_uploads` — it already supports arbitrary `documentTypeLid` + `entityType`/`entityId`.

## 3. API (config-service, `company-config` module)

New DTOs in `apps/services/config-service/src/app/company-config/dto/`:

- `create-offer-benefit.dto.ts` — `companyId`, `configId?`, `title` (`@MaxLength(100)`), `description` (`@MaxLength(500)`), `redirectionUrl` (`@IsUrl()`), `imageFileId?`, `displayOrder?`.
- `update-offer-benefit.dto.ts` — same fields, all optional (partial update), plus `isEnabled?`.
- `reorder-offer-benefit.dto.ts` — `items: { id: number; displayOrder: number }[]`.

New endpoints on `CompanyConfigController` (kept in the existing controller, matching how scope/auth-mapping endpoints already live there rather than a separate controller):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/config-company/offers/:companyId` | List items for a company (query `?configId=` optional, to fetch a domain-level override set; omitted = company-level defaults) |
| `POST` | `/config-company/offers` | Create a new item |
| `PUT` | `/config-company/offers/:id` | Update an item (title/description/URL/image/enabled) |
| `DELETE` | `/config-company/offers/:id` | Delete an item |
| `PUT` | `/config-company/offers/reorder` | Bulk-update `displayOrder` for a set of items |

`CompanyConfigService`/`CompanyConfigRepository` get corresponding methods (`getOfferBenefits`, `createOfferBenefit`, `updateOfferBenefit`, `deleteOfferBenefit`, `reorderOfferBenefits`), following the existing pattern used for `getConfigScope`/`upsertConfigScope`. Delete should best-effort also call the existing file-upload delete for the associated `imageFileId` (same as logo delete in `BrandingSection`), but must not fail the row delete if the file is already gone.

## 4. Frontend (`apps/ui/iwork`)

### 4.1 New component
`apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/OffersAndBenefitsSection/{index.tsx,styles.ts}` — a sibling to `BrandingSection`/`LoginAuthSection`.

- List/table of items (thumbnail, title, redirection URL, enabled toggle, order) + "Add offer" action opening a `Drawer` form — this is the `FaqsListing`/`HospitalListing` CRUD pattern (table + Drawer), not the simple inline-field pattern `BrandingSection` uses, because this is a variable-length list of records rather than a single fixed set of fields.
- Drawer form fields: image upload (reuse `useFileUpload` exactly as `BrandingSection` does — hidden `<input type="file">` behind an upload box, preview via blob download from `endPoints.fileUploadDownloadById`), title `TextField` (maxLength 100), description `TextField` multiline (maxLength 500), redirection URL `TextField` with client-side URL validation, enabled `Switch`.
- Reorder via up/down icon buttons per row (simplest, consistent with the rest of this admin UI which doesn't use drag-and-drop elsewhere) calling the reorder endpoint.

### 4.2 Wiring into `PortalConfiguration/index.tsx`
- Add `TAB_KEYS.OFFERS_BENEFITS` / `TAB_LABELS` entries in `constants.ts`.
- Render `<OffersAndBenefitsSection companyId={id} configId={activeConfigId} />` under the new tab, following the same `activeConfigId`/domain-tab wiring already used for auth config (`companySubdomain`/`activeConfigId` re-fetch on domain tab switch).
- Offers & Benefits data is fetched/saved independently via its own endpoints (not folded into the big `companyPortalConfig` JSON payload saved by `handleSaveAndPublish`), since it is genuinely relational (own table), unlike `branding`/`dashboardConfig` which are JSONB blobs on `company_portal_configuration_detail`.

### 4.3 Read-only summary
Add an `OfferBenefit[]` summary card to `CompanyConfigurationView/index.tsx` (new `ConfigCard`, same visual language as the existing Login & Authentication card) showing count + thumbnails of enabled items.

### 4.4 Endpoints
Add to `apps/ui/ui-lib/src/lib/constants/endPoints.ts`: `offerBenefitsByCompanyId(companyId, configId?)`, `offerBenefitCreate`, `offerBenefitUpdate(id)`, `offerBenefitDelete(id)`, `offerBenefitReorder`.

## 5. Validation

- Backend: `class-validator` decorators on the DTOs (`@IsUrl()` for `redirectionUrl`, `@MaxLength` for title/description, `@IsNotEmpty()` on required fields) — same convention as `UpsertConfigScopeDto`.
- Frontend: mirror the same constraints in the Drawer form (disable Save until valid), consistent with `inputProps={{ maxLength }}` used in `BrandingSection`.

## 6. Permissions

Reuse the existing Portal Configuration `FeatureKey`s already gating this screen (`VIEW_PORTAL_CONFIGURATION` / `EDIT_PORTAL_CONFIGURATION` / `APPROVE_PORTAL_CONFIGURATION`) — no new permission key needed, since Offers & Benefits is just another Portal Configuration section.

## 7. Testing plan

- Backend: unit tests for `CompanyConfigService` CRUD + reorder methods (mirroring existing scope/auth-mapping test patterns if present), DTO validation tests (invalid URL rejected).
- Frontend: manual verification via the `run` skill — create/edit/delete/reorder/enable-disable an item, confirm image upload/preview/delete round-trips, confirm domain-level override doesn't leak into the company-level list and vice versa.

## 8. Rollout

1. Run the new SQL migration in each environment (additive, no impact on existing tables/rows).
2. Deploy `config-service` with the new entity/module wiring.
3. Deploy `iwork` UI with the new tab (feature is inert — new tab, no existing behavior touched — until an admin adds items).

## 9. Open questions / future extensibility

- **Scheduling**: adding `starts_at`/`ends_at` nullable timestamp columns later is a pure additive migration — no design change needed now.
- **IBP display/consumption**: a follow-up spec should define the read endpoint + display component (`ibp` app) that renders enabled, in-scope items; this TRD's schema (`isEnabled`, `displayOrder`, `configId` scoping) already supports that without further schema changes.
