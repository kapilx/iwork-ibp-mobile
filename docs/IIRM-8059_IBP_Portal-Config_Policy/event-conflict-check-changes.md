# Event Conflict Check — Change Documentation

## Overview

When a user selects an event type in the Template Editor (both create and edit mode), the system now checks whether another template already has the same event type and channel type combination mapped. If a conflict is found, a dialog is shown blocking the selection.

---

## Files Changed

### 1. Backend — `template.repository.ts`

**Path:** `apps/services/notification-service/src/app/template/template.repository.ts`

**What changed:**

- Added a new method `checkEventConflict`.
- Injected `NotificationChannelType` repository into the constructor to allow channel type lookup by key.

**Method: `checkEventConflict`**

```typescript
async checkEventConflict(
    templateId: number,
    eventTypeId: number,
    channelTypeKey: string
): Promise<NotificationChannelEventTemplateMapping | null>
```

**How it works:**

1. Maps frontend channel keys to DB `channel_type_key` values:

   | Frontend Key | DB Key                           |
   | ------------ | -------------------------------- |
   | `email`      | `NOTIFICATION_CHANNEL_EMAIL`     |
   | `sms`        | `NOTIFICATION_CHANNEL_SMS`       |
   | `whats-app`  | `NOTIFICATION_CHANNEL_WHATS_APP` |
   | `in-app`     | `NOTIFICATION_CHANNEL_IN_APP`    |

2. Looks up the channel type entity using the mapped DB key.
3. Builds a TypeORM query to find any template with the same `eventTypeId` and `channelTypeId`.
4. In edit mode (`templateId > 0`), excludes the current template from the search.
5. Returns the conflicting template or `null`.

**Constructor change:**

```typescript
@InjectRepository(NotificationChannelType)
private readonly channelTypeRepository: Repository<NotificationChannelType>,
```

---

### 2. Backend — `template.service.ts`

**Path:** `apps/services/notification-service/src/app/template/template.service.ts`

**What changed:**

- Added `checkEventConflict` method that calls the repository and formats the result.

**Method:**

```typescript
async checkEventConflict(
    templateId: number,
    eventTypeId: number,
    channelTypeKey: string
): Promise<{ isMapped: boolean; conflictingTemplate?: { id: number; subject: string; channelType: string } }>
```

**How it works:**

- Calls `templateRepository.checkEventConflict`.
- Returns `{ isMapped: false }` if no conflict.
- Returns `{ isMapped: true, conflictingTemplate: { id, subject, channelType } }` if a conflict exists.

---

### 3. Backend — `template.controller.ts`

**Path:** `apps/services/notification-service/src/app/template/template.controller.ts`

**What changed:**

- Added a new POST endpoint `check-event-conflict`.
- Updated `@ApiBody` Swagger schema to include `channelTypeKey` as a required field.

**Endpoint:**

```
POST /templates/check-event-conflict
```

**Request Body:**

```json
{
  "templateId": 0,
  "eventTypeId": 18,
  "channelTypeKey": "sms"
}
```

- `templateId`: Current template ID. Send `0` for create mode.
- `eventTypeId`: The event type selected by the user.
- `channelTypeKey`: The channel type key from the frontend (`email`, `sms`, `whats-app`, `in-app`).

**Response:**

```json
{
  "data": {
    "isMapped": true,
    "conflictingTemplate": {
      "id": 5,
      "subject": "Welcome Email",
      "channelType": "Email"
    }
  }
}
```

**Important:** The endpoint is placed **before** `@Get(':id')` in the controller to avoid NestJS routing conflicts where `:id` would match the string `check-event-conflict`.

---

### 4. Frontend — `endPoints.ts`

**Path:** `apps/ui/ui-lib/src/lib/constants/endPoints.ts`

**What changed:**

- Added `checkEventConflict` endpoint constant.

```typescript
checkEventConflict: `${environment.notificationUrl}/templates/check-event-conflict`;
```

---

### 5. Frontend — `TemplateEditor/types.ts`

**Path:** `apps/ui/iwork/src/app/pages/TemplatePage/TemplateEditor/types.ts`

**What changed:**

- Added `conflictDialog` field to `TemplateEditorState`.

```typescript
conflictDialog?: {
    open: boolean;
    conflictingTemplateName: string;
    channelType: string;
}
```

---

### 6. Frontend — `TemplateEditor/index.tsx`

**Path:** `apps/ui/iwork/src/app/pages/TemplatePage/TemplateEditor/index.tsx`

**What changed:**

- Added `handleEventTypeChange` async function.
- Added conflict `Dialog` UI rendered outside `TemplateLayout` (wrapped in a React fragment `<>...</>`).
- Replaced all inline `sx` styles on the Dialog with styled components.
- Removed unused MUI imports (`Box`, `DialogContentText`, `DialogActions`).

**Function: `handleEventTypeChange`**

```typescript
const handleEventTypeChange = async (newValue: ApiEventType | null) => { ... }
```

**How it works:**

1. If `newValue` is null, clears the event type and returns.
2. Reads the auth token from `sessionStorage`.
3. POSTs to `checkEventConflict` with:
   - `templateId`: actual ID in edit mode, `0` in create mode
   - `eventTypeId`: the selected event type's ID
   - `channelTypeKey`: `state.formData.channelType` (already loaded from template in edit mode)
4. If `result.isMapped` is `true`, opens the conflict dialog with the conflicting template's name and channel.
5. If no conflict, updates the form with the selected event type.

**Create vs Edit mode:**

| Mode   | `templateId` sent  | Channel source                                         |
| ------ | ------------------ | ------------------------------------------------------ |
| Create | `0`                | `state.formData.channelType` (user selected)           |
| Edit   | Actual template ID | `state.formData.channelType` (loaded from DB on mount) |

---

### 7. Frontend — `TemplateEditor/styles.ts`

**Path:** `apps/ui/iwork/src/app/pages/TemplatePage/TemplateEditor/styles.ts`

**What changed:**

- Added 5 new styled components for the conflict dialog, following the project's `styled()` pattern using MUI's `styled` from `@mui/material/styles`.

| Styled Component        | Replaces                              |
| ----------------------- | ------------------------------------- |
| `ConflictDialogPaper`   | `PaperProps={{ sx: { ... } }}`        |
| `ConflictDialogTitle`   | `DialogTitle` with `sx` font styles   |
| `ConflictDialogText`    | `DialogContentText` with `sx` styles  |
| `ConflictHighlight`     | `<Box component="span" sx={{ ... }}>` |
| `ConflictDialogActions` | `DialogActions` with `sx` padding     |

---

## Key Design Decisions

1. **Channel is always sent from the frontend directly** — never derived from the template ID on the backend. This keeps the logic consistent between create and edit modes.

2. **`templateId=0` for create mode** — the backend treats `0` as "no template to exclude", checking all templates for a conflict.

3. **Channel key mapping in the repository** — the frontend uses short keys (`sms`, `email`) while the DB stores full keys (`NOTIFICATION_CHANNEL_SMS`). The mapping is done in the repository layer.

4. **Styled components over inline `sx`** — all Dialog styles are moved to `styles.ts` to follow the project's established pattern of keeping styles separate from component logic.
