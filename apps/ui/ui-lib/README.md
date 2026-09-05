# UI Library (ui-lib)

This is a shared UI library for the Insurance Wellness Hub application. It contains reusable components, utilities, hooks, and other shared resources that can be imported across different applications in the monorepo.

## 📁 Folder Structure

```
apps/ui/ui-lib/src/lib/
├── assets/                 # Static assets (images, icons, SVGs)
├── commonComponents/       # Reusable UI components
├── constants/             # Application constants and enums
├── hooks/                 # Custom React hooks
├── redux/                 # Redux store, slices, and related logic
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions and helpers
└── index.ts              # Main export file
```

## 🚀 Getting Started

### Importing from UI Library

All exports from the UI library can be imported using the `@ui/ui-lib` alias:

```typescript
// Import components
import { Button, Card, Table } from '@ui/ui-lib';

// Import hooks
import { useTableController, useLocalization } from '@ui/ui-lib';

// Import utilities
import { apiRequest, getSessionStorageData } from '@ui/ui-lib';

// Import constants
import { endPoints, SAVE, DELETE } from '@ui/ui-lib';

// Import types
import { User, ApiResponse } from '@ui/ui-lib';
```

## 📦 Adding New Components

### 1. Common Components

When adding a new common component:

1. **Create the component folder:**
   ```
   apps/ui/ui-lib/src/lib/commonComponents/MyNewComponent/
   ├── index.tsx        # Main component file
   ├── styles.ts        # Styled components
   ├── types.ts         # Component-specific types (if needed)
   └── README.md        # Component documentation (optional)
   ```

2. **Export from the commonComponents index file:**
   ```typescript
   // apps/ui/ui-lib/src/lib/commonComponents/index.ts
   export { default as MyNewComponent } from './MyNewComponent';
   ```

3. **The component will automatically be available for import:**
   ```typescript
   import { MyNewComponent } from '@ui/ui-lib';
   ```

### 2. Hooks

When adding a new custom hook:

1. **Create the hook file:**
   ```
   apps/ui/ui-lib/src/lib/hooks/useMyCustomHook.ts
   ```

2. **Export from the hooks index file:**
   ```typescript
   // apps/ui/ui-lib/src/lib/hooks/index.ts
   export { default as useMyCustomHook } from './useMyCustomHook';
   ```

### 3. Utilities

When adding a new utility function:

1. **Add to existing utility file or create new one:**
   ```
   apps/ui/ui-lib/src/lib/utils/myUtility.ts
   ```

2. **Export from the utils index file:**
   ```typescript
   // apps/ui/ui-lib/src/lib/utils/index.ts
   export { myUtilityFunction } from './myUtility';
   ```

### 4. Constants

When adding new constants:

1. **Add to existing constants file or create new one:**
   ```
   apps/ui/ui-lib/src/lib/constants/myConstants.ts
   ```

2. **Export from the constants index file:**
   ```typescript
   // apps/ui/ui-lib/src/lib/constants/index.ts
   export * from './myConstants';
   ```

### 5. Types

When adding new TypeScript types:

1. **Create or add to types file:**
   ```
   apps/ui/ui-lib/src/lib/types/myTypes.ts
   ```

2. **Export from the types index file:**
   ```typescript
   // apps/ui/ui-lib/src/lib/types/index.ts
   export * from './myTypes';
   ```

## 📝 Export Pattern

The main `index.ts` file at `apps/ui/ui-lib/src/lib/index.ts` should re-export everything from subdirectories:

```typescript
// Re-export all common components
export * from './commonComponents';

// Re-export all hooks
export * from './hooks';

// Re-export all utilities
export * from './utils';

// Re-export all constants
export * from './constants';

// Re-export all types
export * from './types';

// Re-export Redux exports
export * from './redux';
```

## 🚨 Important Notes

1. **Always update index files:** When adding new exports, always update the corresponding `index.ts` file in the subdirectory.

2. **Avoid duplicate entries:** Before adding a new export, check if it already exists in the index file to prevent duplicate entries. All exports eventually flow through the main `lib/index.ts` file.

3. **Single source of truth:** Each component, hook, utility, or constant should be exported only once in its respective index file. The main `lib/index.ts` re-exports everything, creating a single import point.

4. **Avoid circular dependencies:** Be careful not to create circular import dependencies between modules.

5. **Test imports:** After adding new exports, test that they can be imported correctly using the `@ui/ui-lib` alias.

6. **Documentation:** Document complex components and utilities with JSDoc comments.

7. **Breaking Changes:** When making breaking changes to exported APIs, coordinate with all consuming applications.

## 🔍 Troubleshooting

### Import Issues

If you can't import something from `@ui/ui-lib`:

1. Check that it's exported in the appropriate `index.ts` file
2. Verify the main `lib/index.ts` re-exports the subdirectory
3. Restart your development server
4. Check for TypeScript compilation errors
5. Ensure no duplicate exports exist in the same index file

### Build Issues

If the library doesn't build:

1. Run `npx nx build ui-lib` to see specific errors
2. Check for missing dependencies in `package.json`
3. Ensure all imports use proper paths
4. Verify TypeScript configuration
5. Look for duplicate export declarations that might cause conflicts

### Export Flow Verification

To verify the export flow is working correctly:

1. Check the component/hook/utility is exported in its subdirectory's `index.ts`
2. Verify the subdirectory is re-exported in the main `lib/index.ts`
3. Test the import: `import { YourExport } from '@ui/ui-lib'`
4. If it fails, check for naming conflicts or duplicate exports